-- Full-length website screenshot shown on the project page (after the client
-- feedback). Additive and safe on live data: the column has a default, so
-- existing projects keep working and simply show no screenshot box.
-- Run this BEFORE deploying the matching site code (saving a project from the
-- admin writes this column).

alter table public.projects
  add column full_page_image text not null default '' check (char_length(full_page_image) <= 2000);

-- Very tall screenshots (e.g. 1920 x 6000 px) are heavier than ordinary photos,
-- so the media bucket now accepts files up to 10 MB (was 5 MB).
update storage.buckets set file_size_limit = 10485760 where id = 'site-media';
