-- 更新排片日期为2025年的未来日期
-- 将所有2019年5月的排片更新为2025年11月
UPDATE t_schedule SET show_date = REPLACE(show_date, '2019-5-', '2025-11-') WHERE show_date LIKE '2019-5-%';

-- 将所有2019年7月的排片更新为2025年11月
UPDATE t_schedule SET show_date = REPLACE(show_date, '2019-7-', '2025-11-') WHERE show_date LIKE '2019-7-%';

-- 将所有2019年8月的排片更新为2025年11月
UPDATE t_schedule SET show_date = REPLACE(show_date, '2019-8-', '2025-11-') WHERE show_date LIKE '2019-8-%';

-- 将所有2019年9月的排片更新为2025年11月
UPDATE t_schedule SET show_date = REPLACE(show_date, '2019-9-', '2025-11-') WHERE show_date LIKE '2019-9-%';

-- 将所有2019年11月的排片更新为2025年11月
UPDATE t_schedule SET show_date = REPLACE(show_date, '2019-11-', '2025-11-') WHERE show_date LIKE '2019-11-%';

-- 将所有2019年12月的排片更新为2025年12月
UPDATE t_schedule SET show_date = REPLACE(show_date, '2019-12-', '2025-12-') WHERE show_date LIKE '2019-12-%';

-- 查看更新后的排片
SELECT schedule_id, movie_id, show_date, show_time FROM t_schedule ORDER BY show_date, show_time;
