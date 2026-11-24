-- Custom SQL migration file, put your code below! --
CREATE FUNCTION forbid_modification() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'La tabla % es de solo añadir: % no está permitido', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER draw_event_append_only
  BEFORE UPDATE OR DELETE ON draw_event
  FOR EACH ROW EXECUTE FUNCTION forbid_modification();
--> statement-breakpoint
CREATE TRIGGER draw_event_no_truncate
  BEFORE TRUNCATE ON draw_event
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_modification();
--> statement-breakpoint
CREATE TRIGGER audit_log_append_only
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION forbid_modification();
--> statement-breakpoint
CREATE TRIGGER audit_log_no_truncate
  BEFORE TRUNCATE ON audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_modification();
