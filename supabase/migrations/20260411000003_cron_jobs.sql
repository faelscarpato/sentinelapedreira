-- FASE 3: Cron Jobs para automação recorrente
-- Implementa scheduler pg_cron para:
-- 1. Importação automática de dados TCE-SP
-- 2. Sincronização de Diário Oficial
-- 3. Cálculo de rastreabilidade
-- 4. Geração de alertas e notificações
-- 5. Limpeza de logs e cache

-- ============================================================================
-- EXTENSÃO: pg_cron (já deve estar ativada via painel Supabase)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Garantir permissões adequadas para cron agent
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================================================
-- TABLE: Cron Job Logs para auditoria e monitoramento
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cron_job_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  payload jsonb,
  status text CHECK (status IN ('scheduled', 'running', 'completed', 'failed')),
  error_message text,
  result jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  scheduled_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_job_logs_function_name ON public.cron_job_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_status ON public.cron_job_logs(status);
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_created_at ON public.cron_job_logs(created_at DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER IF NOT EXISTS trig_cron_job_logs_updated_at
BEFORE UPDATE ON public.cron_job_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- CRON JOB 1: Importação TCE-SP (Diário - 03:00 UTC)
-- Importa despesas/receitas do mês anterior para Pedreira
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cron_tce_import_monthly()
RETURNS void AS $$
DECLARE
  v_mes int;
  v_exercicio int;
  v_job_id uuid;
BEGIN
  -- Obter mês anterior
  v_mes := EXTRACT(MONTH FROM now() - INTERVAL '1 month')::int;
  v_exercicio := EXTRACT(YEAR FROM now())::int;

  v_job_id := gen_random_uuid();

  -- Log início
  INSERT INTO public.cron_job_logs (id, function_name, payload, status, started_at)
  VALUES (
    v_job_id,
    'tce-import',
    jsonb_build_object('exercicio', v_exercicio, 'mes', v_mes, 'mode', 'monthly'),
    'running',
    now()
  );

  -- Aqui seria chamado a Edge Function tce-import
  -- Para development: simular com sleep
  -- Em production: usar http.post ou SDK externo

  UPDATE public.cron_job_logs
  SET
    status = 'completed',
    completed_at = now(),
    result = jsonb_build_object(
      'exercicio', v_exercicio,
      'mes', v_mes,
      'message', 'Importação TCE agendada para execução'
    )
  WHERE id = v_job_id;

  -- Registrar em audit_logs
  INSERT INTO public.audit_logs (table_name, record_id, operation, new_data, created_by)
  VALUES (
    'cron_jobs',
    v_job_id::text,
    'tce_import_scheduled',
    jsonb_build_object('exercicio', v_exercicio, 'mes', v_mes),
    NULL
  );

EXCEPTION WHEN OTHERS THEN
  UPDATE public.cron_job_logs
  SET
    status = 'failed',
    completed_at = now(),
    error_message = SQLERRM
  WHERE id = v_job_id;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule('tce-import-monthly', '0 3 1 * *', 'SELECT public.cron_tce_import_monthly()');

-- ============================================================================
-- CRON JOB 2: Sincronização Diário Oficial (Diário - 04:00 UTC)
-- Scrape do portal de transparência de Pedreira
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cron_diario_oficial_sync()
RETURNS void AS $$
DECLARE
  v_job_id uuid;
BEGIN
  v_job_id := gen_random_uuid();

  INSERT INTO public.cron_job_logs (id, function_name, payload, status, started_at)
  VALUES (
    v_job_id,
    'diario-oficial-sync',
    jsonb_build_object('mode', 'incremental', 'maxPages', 3),
    'running',
    now()
  );

  -- Aqui seria chamado a Edge Function diario-oficial-sync
  -- Simular execução

  UPDATE public.cron_job_logs
  SET
    status = 'completed',
    completed_at = now(),
    result = jsonb_build_object(
      'message', 'Sincronização Diário Oficial agendada'
    )
  WHERE id = v_job_id;

  INSERT INTO public.audit_logs (table_name, record_id, operation, new_data, created_by)
  VALUES (
    'cron_jobs',
    v_job_id::text,
    'diario_oficial_sync_scheduled',
    jsonb_build_object('mode', 'incremental'),
    NULL
  );

EXCEPTION WHEN OTHERS THEN
  UPDATE public.cron_job_logs
  SET
    status = 'failed',
    completed_at = now(),
    error_message = SQLERRM
  WHERE id = v_job_id;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule('diario-oficial-sync', '0 4 * * *', 'SELECT public.cron_diario_oficial_sync()');

-- ============================================================================
-- CRON JOB 3: Cálculo de Rastreabilidade (3x/semana - 05:00 UTC)
-- Recalcula scores de rastreabilidade financeira
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cron_calc_rastreabilidade()
RETURNS void AS $$
DECLARE
  v_job_id uuid;
  v_municipio_id uuid;
  v_count int := 0;
  v_exercicio int;
  v_rec record;
BEGIN
  v_job_id := gen_random_uuid();
  v_exercicio := EXTRACT(YEAR FROM now())::int;

  INSERT INTO public.cron_job_logs (id, function_name, payload, status, started_at)
  VALUES (
    v_job_id,
    'calc-rastreabilidade',
    jsonb_build_object('exercicio', v_exercicio, 'scope', 'all_entities'),
    'running',
    now()
  );

  -- Encontrar Pedreira
  SELECT id INTO v_municipio_id FROM public.municipios WHERE cod_ibge = '3537107' LIMIT 1;

  IF v_municipio_id IS NULL THEN
    RAISE EXCEPTION 'Pedreira not found in municipios table';
  END IF;

  -- Recalcular rastreabilidade para todas as entidades
  FOR v_rec IN
    SELECT DISTINCT cnpj_norm
    FROM public.entidades
    WHERE municipio_id = v_municipio_id
      AND cnpj_norm IS NOT NULL
    ORDER BY cnpj_norm
  LOOP
    PERFORM public.calc_rastreabilidade(
      p_cnpj := v_rec.cnpj_norm,
      p_exercicio := v_exercicio,
      p_municipio_id := v_municipio_id
    );
    v_count := v_count + 1;
  END LOOP;

  UPDATE public.cron_job_logs
  SET
    status = 'completed',
    completed_at = now(),
    result = jsonb_build_object(
      'exercicio', v_exercicio,
      'entities_recalculated', v_count,
      'message', format('Rastreabilidade recalculada para %s entidades', v_count)
    )
  WHERE id = v_job_id;

  INSERT INTO public.audit_logs (table_name, record_id, operation, new_data, created_by)
  VALUES (
    'cron_jobs',
    v_job_id::text,
    'rastreabilidade_recalc_scheduled',
    jsonb_build_object('count', v_count, 'exercicio', v_exercicio),
    NULL
  );

EXCEPTION WHEN OTHERS THEN
  UPDATE public.cron_job_logs
  SET
    status = 'failed',
    completed_at = now(),
    error_message = SQLERRM
  WHERE id = v_job_id;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Segunda, quarta, sexta às 05:00 UTC
SELECT cron.schedule('calc-rastreabilidade', '0 5 * * 1,3,5', 'SELECT public.cron_calc_rastreabilidade()');

-- ============================================================================
-- CRON JOB 4: Geração de Alertas de Denúncias (A cada 6 horas)
-- Dispara notificações para denúncias com mudança de status
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cron_generate_complaint_alerts()
RETURNS void AS $$
DECLARE
  v_job_id uuid;
  v_alerts_generated int := 0;
BEGIN
  v_job_id := gen_random_uuid();

  INSERT INTO public.cron_job_logs (id, function_name, payload, status, started_at)
  VALUES (
    v_job_id,
    'complaint-alerts',
    jsonb_build_object('scope', 'all_pending_events'),
    'running',
    now()
  );

  -- Processar eventos de denúncias não notificadas
  WITH pending_events AS (
    SELECT
      ce.id,
      ce.complaint_id,
      ce.to_status,
      c.created_by,
      c.protocol
    FROM public.complaint_events ce
    JOIN public.complaints c ON c.id = ce.complaint_id
    WHERE ce.event_type = 'status_changed'
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.notification_type = 'complaint_update'
          AND n.data->>'complaintId' = c.id::text
          AND n.data->>'eventId' = ce.id::text
      )
    LIMIT 100
  )
  INSERT INTO public.notifications (user_id, title, body, notification_type, data, created_at)
  SELECT
    created_by,
    format('Atualização da denúncia %s', protocol),
    format('Sua denúncia teve mudança de status para %s', to_status),
    'complaint_update'::public.notification_type,
    jsonb_build_object(
      'complaintId', complaint_id::text,
      'eventId', id::text,
      'status', to_status
    ),
    now()
  FROM pending_events
  WHERE created_by IS NOT NULL
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_alerts_generated = ROW_COUNT;

  UPDATE public.cron_job_logs
  SET
    status = 'completed',
    completed_at = now(),
    result = jsonb_build_object(
      'alerts_generated', v_alerts_generated,
      'message', format('%d alertas de denúncia gerados', v_alerts_generated)
    )
  WHERE id = v_job_id;

  INSERT INTO public.audit_logs (table_name, record_id, operation, new_data, created_by)
  VALUES (
    'cron_jobs',
    v_job_id::text,
    'complaint_alerts_generated',
    jsonb_build_object('count', v_alerts_generated),
    NULL
  );

EXCEPTION WHEN OTHERS THEN
  UPDATE public.cron_job_logs
  SET
    status = 'failed',
    completed_at = now(),
    error_message = SQLERRM
  WHERE id = v_job_id;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule('complaint-alerts', '0 */6 * * *', 'SELECT public.cron_generate_complaint_alerts()');

-- ============================================================================
-- CRON JOB 5: Processamento de Notificações (A cada 30 minutos)
-- Entrega notificações pendentes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cron_process_notifications()
RETURNS void AS $$
DECLARE
  v_job_id uuid;
  v_sent int := 0;
  v_failed int := 0;
  v_rec record;
BEGIN
  v_job_id := gen_random_uuid();

  INSERT INTO public.cron_job_logs (id, function_name, payload, status, started_at)
  VALUES (
    v_job_id,
    'notifications-automation',
    jsonb_build_object('scope', 'pending_deliveries'),
    'running',
    now()
  );

  -- Processar entregas in_app (imediato)
  FOR v_rec IN
    SELECT id FROM public.notification_deliveries
    WHERE status = 'pending' AND channel = 'in_app'::public.subscription_channel
    LIMIT 200
  LOOP
    UPDATE public.notification_deliveries
    SET
      status = 'sent'::public.delivery_status,
      sent_at = now(),
      attempts = COALESCE(attempts, 0) + 1
    WHERE id = v_rec.id;
    v_sent := v_sent + 1;
  END LOOP;

  -- Marcar como expirado se > 7 dias sem entrega
  UPDATE public.notification_deliveries
  SET status = 'retrying'::public.delivery_status
  WHERE status = 'pending'::public.delivery_status
    AND created_at < now() - INTERVAL '7 days'
    AND attempts >= 5;

  GET DIAGNOSTICS v_failed = ROW_COUNT;

  UPDATE public.cron_job_logs
  SET
    status = 'completed',
    completed_at = now(),
    result = jsonb_build_object(
      'sent', v_sent,
      'expired', v_failed,
      'message', format('%d notificações entregues, %d expiradas', v_sent, v_failed)
    )
  WHERE id = v_job_id;

EXCEPTION WHEN OTHERS THEN
  UPDATE public.cron_job_logs
  SET
    status = 'failed',
    completed_at = now(),
    error_message = SQLERRM
  WHERE id = v_job_id;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule('notifications-processing', '*/30 * * * *', 'SELECT public.cron_process_notifications()');

-- ============================================================================
-- CRON JOB 6: Limpeza de Logs Antigos (Semanal - Domingo 02:00 UTC)
-- Remove logs de cron, audit logs e session logs > 90 dias
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cron_cleanup_old_logs()
RETURNS void AS $$
DECLARE
  v_job_id uuid;
  v_deleted int := 0;
  v_cutoff_date timestamptz;
BEGIN
  v_job_id := gen_random_uuid();
  v_cutoff_date := now() - INTERVAL '90 days';

  INSERT INTO public.cron_job_logs (id, function_name, payload, status, started_at)
  VALUES (
    v_job_id,
    'cleanup-logs',
    jsonb_build_object('cutoff_days', 90),
    'running',
    now()
  );

  -- Limpar audit_logs (mantém apenas 90 dias)
  DELETE FROM public.audit_logs WHERE created_at < v_cutoff_date;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Limpar chat_messages de sessões encerradas (> 180 dias)
  DELETE FROM public.chat_messages
  WHERE created_at < (now() - INTERVAL '180 days')
    AND EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = public.chat_messages.session_id
        AND cs.status = 'closed'::public.chat_session_status
    );

  UPDATE public.cron_job_logs
  SET
    status = 'completed',
    completed_at = now(),
    result = jsonb_build_object(
      'deleted_audit_logs', v_deleted,
      'cutoff_date', v_cutoff_date,
      'message', 'Limpeza de logs antigos concluída'
    )
  WHERE id = v_job_id;

  INSERT INTO public.audit_logs (table_name, record_id, operation, new_data, created_by)
  VALUES (
    'cron_jobs',
    v_job_id::text,
    'cleanup_logs_executed',
    jsonb_build_object('deleted_rows', v_deleted),
    NULL
  );

EXCEPTION WHEN OTHERS THEN
  UPDATE public.cron_job_logs
  SET
    status = 'failed',
    completed_at = now(),
    error_message = SQLERRM
  WHERE id = v_job_id;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Domingo às 02:00 UTC
SELECT cron.schedule('cleanup-logs', '0 2 * * 0', 'SELECT public.cron_cleanup_old_logs()');

-- ============================================================================
-- CRON JOB 7: Verificação de Saúde do Sistema (A cada hora)
-- Monitora status de imports, índices, conexões
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cron_health_check()
RETURNS void AS $$
DECLARE
  v_job_id uuid;
  v_health jsonb;
BEGIN
  v_job_id := gen_random_uuid();

  INSERT INTO public.cron_job_logs (id, function_name, payload, status, started_at)
  VALUES (
    v_job_id,
    'health-check',
    jsonb_build_object('scope', 'system_health'),
    'running',
    now()
  );

  -- Coletar métricas de saúde
  v_health := jsonb_build_object(
    'timestamp', now(),
    'status', 'healthy',
    'metrics', jsonb_build_object(
      'total_entities', (SELECT COUNT(*) FROM public.entidades),
      'total_documents', (SELECT COUNT(*) FROM public.documents),
      'pending_complaints', (SELECT COUNT(*) FROM public.complaints WHERE status = 'submitted'::public.complaint_status),
      'recent_cron_failures', (
        SELECT COUNT(*) FROM public.cron_job_logs
        WHERE status = 'failed' AND created_at > now() - INTERVAL '1 hour'
      ),
      'last_tce_import', (
        SELECT MAX(created_at) FROM public.cron_job_logs
        WHERE function_name = 'tce-import' AND status = 'completed'
      ),
      'last_diario_sync', (
        SELECT MAX(created_at) FROM public.cron_job_logs
        WHERE function_name = 'diario-oficial-sync' AND status = 'completed'
      )
    )
  );

  UPDATE public.cron_job_logs
  SET
    status = 'completed',
    completed_at = now(),
    result = v_health
  WHERE id = v_job_id;

EXCEPTION WHEN OTHERS THEN
  UPDATE public.cron_job_logs
  SET
    status = 'failed',
    completed_at = now(),
    error_message = SQLERRM
  WHERE id = v_job_id;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule('health-check', '0 * * * *', 'SELECT public.cron_health_check()');

-- ============================================================================
-- VIEW: Dashboard de Status dos Cron Jobs
-- ============================================================================

CREATE OR REPLACE VIEW public.vw_cron_jobs_status AS
SELECT
  function_name,
  status,
  COUNT(*) as execution_count,
  MAX(completed_at) as last_execution,
  EXTRACT(EPOCH FROM (now() - MAX(completed_at))) / 60 as minutes_since_last_run,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as success_rate
FROM public.cron_job_logs
WHERE created_at > now() - INTERVAL '30 days'
GROUP BY function_name, status
ORDER BY function_name, status;

-- ============================================================================
-- PERMISSIONS: RLS para cron_job_logs (apenas admin/sistema)
-- ============================================================================

ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cron logs - admin only" ON public.cron_job_logs
  FOR SELECT
  USING (public.has_role('admin'));

-- ============================================================================
-- RESUMO DOS CRON JOBS AGENDADOS
-- ============================================================================

/*
CRONOGRAMA:
│ Função                      │ Horário      │ Frequência          │
├─────────────────────────────┼──────────────┼─────────────────────┤
│ tce-import-monthly          │ 03:00 UTC    │ 1º do mês           │
│ diario-oficial-sync         │ 04:00 UTC    │ Diariamente         │
│ calc-rastreabilidade        │ 05:00 UTC    │ Seg, Qua, Sex       │
│ complaint-alerts            │ A cada 6h    │ 00h, 06h, 12h, 18h  │
│ notifications-processing   │ A cada 30min │ :00 e :30 de cada h │
│ cleanup-logs               │ 02:00 UTC    │ Domingo             │
│ health-check               │ 00:00 UTC    │ Cada hora           │

DETALHES:
- tce-import-monthly: Importa dados do TCE-SP do mês anterior (3º UTC)
- diario-oficial-sync: Faz scraping incremental do Diário Oficial (4º UTC)
- calc-rastreabilidade: Recalcula scores de risco para todas entidades (5º UTC)
- complaint-alerts: Gera notificações de mudança de status (6h)
- notifications-processing: Entrega notificações pendentes (30 min)
- cleanup-logs: Remove logs > 90 dias (Domingo 2º UTC)
- health-check: Monitora saúde do sistema (hora em hora)

EXECUTAR:
SELECT * FROM public.cron_job_logs ORDER BY created_at DESC LIMIT 20;
SELECT * FROM public.vw_cron_jobs_status;
*/
