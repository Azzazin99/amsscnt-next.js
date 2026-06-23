UPDATE "people" SET "prefix" = 'นาย', "sex" = '1'
WHERE regexp_replace(trim("prefix"), '\s+', '', 'g') = 'นาย';
--> statement-breakpoint
UPDATE "people" SET "prefix" = 'นาง', "sex" = '2'
WHERE regexp_replace(trim("prefix"), '\s+', '', 'g') = 'นาง';
--> statement-breakpoint
UPDATE "people" SET "prefix" = 'นางสาว', "sex" = '2'
WHERE regexp_replace(trim("prefix"), '\s+', '', 'g') = 'นางสาว';
