-- complete_onboarding_v2 là SECURITY DEFINER và tin p_user_id do caller truyền vào.
-- Mặc định Postgres cấp EXECUTE cho PUBLIC → bất kỳ user authenticated nào cũng gọi được
-- qua PostgREST /rpc/ với UUID tùy ý. Chỉ API route (service_role, đã withAuth) được gọi.
REVOKE EXECUTE ON FUNCTION complete_onboarding_v2(uuid, text, numeric, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION complete_onboarding_v2(uuid, text, numeric, jsonb, jsonb)
  TO service_role;
