-- =====================================================================
--  স্বাক্ষরকারীদের ক্রম বদলানো
--
--  রিপোর্টে স্বাক্ষরের ঘরগুলো app_settings.data->'signatories' তালিকার
--  ক্রম অনুযায়ী বাঁ থেকে ডানে বসে। তাই ক্রম বদলাতে হলে ঐ তালিকার
--  সাজানোটাই বদলাতে হয়।
--
--  চালানোর জায়গা : Supabase Dashboard → SQL Editor
--  তৈরি          : ২০২৬-০৯-০১
--
--  আগের ক্রম                    নতুন ক্রম
--  ------------------------     ------------------------
--  ১. শিশির কুমার দাস           ১. শিশির কুমার দাস
--  ২. নীতিশ রঞ্জন ভৌমিক         ২. নির্মল কুমার মন্ডল
--  ৩. সুকুমার কুমার মন্ডল       ৩. সুকুমার কুমার মন্ডল
--  ৪. সীমা চন্দ                 ৪. সীমা চন্দ
--  ৫. নির্মল কুমার মন্ডল        ৫. নীতিশ রঞ্জন ভৌমিক
--
--  ℹ️  কারো নাম বা পদবি বদলাচ্ছে না, কেউ যোগ বা বাদ যাচ্ছে না —
--     কেবল সাজানোর ক্রম। টাকার হিসাবে কোনো প্রভাব নেই।
-- =====================================================================


-- ---------------------------------------------------------------------
--  ধাপ ১ — ব্যাকআপ (আগে একা চালান)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings_backup_20260901 AS
SELECT * FROM app_settings WHERE id = 1;

SELECT count(*) AS backup_rows FROM app_settings_backup_20260901;
--  প্রত্যাশিত: ১ সারি


-- ---------------------------------------------------------------------
--  ধাপ ২ — বদলানোর আগের ক্রম দেখে নিন
-- ---------------------------------------------------------------------
SELECT ord, s->>'id' AS id, s->>'name' AS naam, s->>'designation' AS podobi
FROM app_settings,
     jsonb_array_elements(data::jsonb->'signatories') WITH ORDINALITY AS t(s, ord)
WHERE id = 1
ORDER BY ord;


-- ---------------------------------------------------------------------
--  ধাপ ৩ — নতুন ক্রমে সাজানো
--
--  তালিকাটি id অনুযায়ী নতুন করে গাঁথা হচ্ছে (s1 → s5 → s3 → s4 → s2)।
--  নাম-পদবি ডাটাবেজ থেকেই নেওয়া হয়, এখানে হাতে লেখা হয় না — তাই
--  বানান ভুলের বা তথ্য হারানোর ঝুঁকি নেই।
--
--  data কলামটি json নাকি jsonb — দুই রকমই হতে পারে, আর jsonb_set কেবল
--  jsonb-তে চলে। তাই কলামের প্রকৃত ধরন pg_attribute থেকে বের করে সেই
--  ধরনেই ফেরত লেখা হচ্ছে। এতে যেকোনো এক ক্ষেত্রেই স্ক্রিপ্টটি চলবে।
--
--  তালিকায় নেই এমন কোনো id থাকলে array_position NULL দেয় এবং সেটি
--  ক্রমের শেষে চলে যায় — কেউ হারিয়ে যায় না।
-- ---------------------------------------------------------------------
DO $$
DECLARE
  coltype text;
  newdata jsonb;
  before_count int;
  after_count  int;
BEGIN
  SELECT jsonb_array_length(data::jsonb->'signatories') INTO before_count
  FROM app_settings WHERE id = 1;

  SELECT jsonb_set(
           data::jsonb,
           '{signatories}',
           (
             SELECT jsonb_agg(s ORDER BY array_position(
                      ARRAY['s1', 's5', 's3', 's4', 's2'],
                      s->>'id'
                    ))
             FROM jsonb_array_elements(data::jsonb->'signatories') AS s
           )
         )
    INTO newdata
  FROM app_settings WHERE id = 1;

  after_count := jsonb_array_length(newdata->'signatories');

  IF before_count IS DISTINCT FROM after_count THEN
    RAISE EXCEPTION 'স্বাক্ষরকারীর সংখ্যা বদলে গেছে (% → %) — কিছু লেখা হয়নি',
      before_count, after_count;
  END IF;

  SELECT atttypid::regtype::text INTO coltype
  FROM pg_attribute
  WHERE attrelid = 'public.app_settings'::regclass
    AND attname = 'data';

  EXECUTE format('UPDATE app_settings SET data = $1::text::%s WHERE id = 1', coltype)
  USING newdata;

  RAISE NOTICE 'ক্রম বদলানো হয়েছে — % জন স্বাক্ষরকারী অক্ষত', after_count;
END $$;


-- ---------------------------------------------------------------------
--  ধাপ ৪ — মিলিয়ে দেখুন
-- ---------------------------------------------------------------------
SELECT ord, s->>'id' AS id, s->>'name' AS naam, s->>'designation' AS podobi
FROM app_settings,
     jsonb_array_elements(data::jsonb->'signatories') WITH ORDINALITY AS t(s, ord)
WHERE id = 1
ORDER BY ord;
--  প্রত্যাশিত:
--    ১  s1  শিশির কুমার দাস        আহ্বায়ক
--    ২  s5  নির্মল কুমার মন্ডল      নির্বাহী সদস্য
--    ৩  s3  সুকুমার কুমার মন্ডল    নির্বাহী সদস্য
--    ৪  s4  সীমা চন্দ              নির্বাহী সদস্য
--    ৫  s2  নীতিশ রঞ্জন ভৌমিক      সদস্য সচিব


-- ---------------------------------------------------------------------
--  ভবিষ্যতে অন্য ক্রম চাইলে
--  ধাপ ৩ এর ARRAY[...] অংশে id গুলো যে ক্রমে চান সেই ক্রমে লিখুন।
--    s1 = শিশির কুমার দাস          s2 = নীতিশ রঞ্জন ভৌমিক
--    s3 = সুকুমার কুমার মন্ডল      s4 = সীমা চন্দ
--    s5 = নির্মল কুমার মন্ডল
-- ---------------------------------------------------------------------


-- ---------------------------------------------------------------------
--  ভুল হলে ফিরিয়ে আনা
-- ---------------------------------------------------------------------
-- UPDATE app_settings
-- SET data = (SELECT data FROM app_settings_backup_20260901 WHERE id = 1)
-- WHERE id = 1;

--  সব ঠিক থাকলে পরে ব্যাকআপ টেবিলটি ফেলে দিতে পারেন:
-- DROP TABLE app_settings_backup_20260901;
