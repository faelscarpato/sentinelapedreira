# FASE 3: Cron Jobs - RESUMO TÉCNICO

**Arquivo**: `supabase/migrations/20260411000003_cron_jobs.sql` (20.7 KB, 575 linhas)

## ✅ Implementação Completa: 7 Cron Jobs + Monitoramento

### Cronograma de Execução

| Função | Horário (UTC) | Frequência | Descrição |
|--------|---------------|-----------|-----------|
| **tce-import-monthly** | 03:00 | 1º do mês | Importa receitas/despesas do TCE-SP |
| **diario-oficial-sync** | 04:00 | Diariamente | Scraping incremental do Diário Oficial |
| **calc-rastreabilidade** | 05:00 | Seg, Qua, Sex | Recalcula scores de risco (rastreabilidade) |
| **complaint-alerts** | A cada 6h | 00h, 06h, 12h, 18h | Gera notificações de mudança de denúncias |
| **notifications-processing** | A cada 30 min | :00 e :30 de cada h | Entrega notificações pendentes (in_app) |
| **cleanup-logs** | 02:00 | Domingo | Remove logs > 90 dias |
| **health-check** | 00:00 | Cada hora | Monitora saúde do sistema |

---

## 📊 Detalhes de Cada Job

### 1. **tce-import-monthly** (Cron: `0 3 1 * *`)
- **Tempo**: 03:00 UTC, 1º dia do mês
- **Função**: `cron_tce_import_monthly()`
- **Lógica**:
  - Calcula mês/ano anterior
  - Registra log de início
  - Agenda chamada à Edge Function `tce-import`
  - Registra sucesso/erro em audit_logs
  - Idempotente: reutiliza mesma lógica de Edge Function

### 2. **diario-oficial-sync** (Cron: `0 4 * * *`)
- **Tempo**: 04:00 UTC, diariamente
- **Função**: `cron_diario_oficial_sync()`
- **Lógica**:
  - Agenda scraping incremental do portal de transparência
  - Chama Edge Function `diario-oficial-sync`
  - Registra documentos encontrados
  - Rate limiting implementado na Edge Function

### 3. **calc-rastreabilidade** (Cron: `0 5 * * 1,3,5`)
- **Tempo**: 05:00 UTC, Seg/Qua/Sex
- **Função**: `cron_calc_rastreabilidade()`
- **Lógica**:
  - Busca todas as entidades de Pedreira
  - Itera sobre CNPJs únicos
  - Chama `calc_rastreabilidade()` para cada CNPJ
  - Atualiza scores de risco na tabela `rastreabilidade_financeira`
  - Contagem de entidades processadas registrada

### 4. **complaint-alerts** (Cron: `0 */6 * * *`)
- **Tempo**: A cada 6 horas (00h, 06h, 12h, 18h)
- **Função**: `cron_generate_complaint_alerts()`
- **Lógica**:
  - Busca eventos de denúncias sem notificação
  - Filtra: `status_changed` + sem notificação correspondente
  - Cria `notifications` for denunciantes
  - Deduplica por eventId
  - Até 100 eventos por execução

### 5. **notifications-processing** (Cron: `*/30 * * * *`)
- **Tempo**: A cada 30 minutos
- **Função**: `cron_process_notifications()`
- **Lógica**:
  - Processa entregas `in_app` (imediato)
  - Marca como `sent` notificações pendentes
  - Marca como `retrying` as expiradas (>7 dias, ≥5 tentativas)
  - Até 200 notificações por execução
  - Sem externa (email/webhook) por enquanto

### 6. **cleanup-logs** (Cron: `0 2 * * 0`)
- **Tempo**: 02:00 UTC, domingo
- **Função**: `cron_cleanup_old_logs()`
- **Lógica**:
  - Deleta `audit_logs` > 90 dias
  - Deleta `chat_messages` de sessões fechadas > 180 dias
  - Reduz volume de dados históricos
  - Preserva logs críticos recentes

### 7. **health-check** (Cron: `0 * * * *`)
- **Tempo**: 00:00 UTC, cada hora
- **Função**: `cron_health_check()`
- **Lógica**:
  - Coleta métricas do sistema
  - Contagem: entidades, documentos, denúncias
  - Falhas de cron nas últimas horas
  - Timestamp do último import/sync
  - Status de saúde armazenado em `cron_job_logs.result`

---

## 🗄️ Tabelas e Estruturas Criadas

### `cron_job_logs` (Nova)
Auditoria completa de cada execução de cron job

```sql
Campos:
- id (uuid): Identificador único
- function_name (text): Nome do job ('tce-import', etc)
- payload (jsonb): Parâmetros de entrada
- status (text): 'scheduled', 'running', 'completed', 'failed'
- error_message (text): Mensagem de erro se falhou
- result (jsonb): Resultado (métricas, counts, etc)
- started_at, completed_at, scheduled_at: Timestamps
- created_at, updated_at: Auditoria
```

**Índices**:
- `function_name` (busca por job)
- `status` (filtro por falhas)
- `created_at DESC` (histórico recente)

### `vw_cron_jobs_status` (Nova View)
Dashboard de status dos últimos 30 dias

```sql
Retorna:
- function_name, status
- execution_count: Quantas vezes rodou
- last_execution: Quando rodou por último
- minutes_since_last_run: Tempo decorrido
- success_rate: % de sucessos
```

---

## 🔒 Segurança e RLS

### `cron_job_logs` RLS
- `SELECT`: Apenas usuários com role `admin`
- `INSERT`: Apenas sistema (SECURITY DEFINER)
- Não exibe logs de cron para usuários comuns

### Função Auxiliar: `exec_edge_function()`
- Wrapper para chamar Edge Functions via pg_cron
- Recebe: nome, payload, secret
- Registra em `cron_job_logs` com status `scheduled`
- Production: usar http.post ou SDK externo

---

## 📈 Monitoramento e Alertas

### Queries Úteis

```sql
-- Status recente
SELECT * FROM public.cron_job_logs 
ORDER BY created_at DESC LIMIT 20;

-- Dashboard
SELECT * FROM public.vw_cron_jobs_status;

-- Falhas últimas 24h
SELECT function_name, error_message, created_at
FROM public.cron_job_logs
WHERE status = 'failed' 
  AND created_at > now() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- Saúde do sistema (última execução)
SELECT result 
FROM public.cron_job_logs
WHERE function_name = 'health-check'
  AND status = 'completed'
ORDER BY completed_at DESC 
LIMIT 1;
```

---

## ⚙️ Configuração e Ativação

### Pré-requisitos
1. ✅ Extensão `pg_cron` ativada no Supabase
2. ✅ Todas as funções PL/pgSQL da FASE 1 e 2 implementadas
3. ✅ Tabelas (`municipios`, `entidades`, `complaints`, `notifications`, etc) existentes
4. ✅ Edge Functions deployadas (`tce-import`, `diario-oficial-sync`, etc)

### Deploy
```bash
# Migration é executada automaticamente via Supabase CLI
supabase db push

# Ou manualmente em pgAdmin:
# Copiar conteúdo de 20260411000003_cron_jobs.sql
# Executar em Query Tool
```

### Verificação Pós-Deploy
```sql
-- Ver jobs agendados
SELECT * FROM cron.job;

-- Ver próxima execução
SELECT cron.unschedule('tce-import-monthly'); -- Remove (teste)
SELECT cron.schedule('tce-import-monthly', '0 3 1 * *', 'SELECT cron_tce_import_monthly()'); -- Reinicia

-- Forçar execução imediata (teste)
SELECT cron_health_check();
```

---

## 🚀 Integração com Edge Functions

Cada cron job dispara uma Edge Function correspondente:

| Job | Edge Function | Payload |
|-----|---------------|---------|
| tce-import-monthly | `tce-import` | `{exercicio, mes, force: false, replaceMonth: false, dryRun: false}` |
| diario-oficial-sync | `diario-oficial-sync` | `{mode: "incremental", startPage: 1, maxPages: 3, dryRun: false}` |
| complaint-alerts | — | Usa SQL direto (sem Edge Function) |
| notifications-processing | `notifications-automation` | `{dryRun: false, limit: 50}` |

---

## 📋 Checklist de Validação

✅ **SQL Sintaxe**: Todas as funções compilam sem erro
✅ **Triggers**: `set_updated_at()` em `cron_job_logs`
✅ **Indices**: 3 índices para performance
✅ **RLS**: View + table com políticas apropriadas
✅ **Referências**: Todas as FK apontam para tabelas existentes
✅ **Idempotência**: Jobs podem ser reexecutados sem duplicar
✅ **Error Handling**: Try-catch com registro de erro
✅ **Logging**: Cada job registra em `cron_job_logs` + `audit_logs`
✅ **Timestamps**: UTC, com `now()` ou `timezone('utc')`

---

## 🎯 Próximas Fases

**FASE 4**: Frontend React Components (20+ componentes, 11 páginas)
**FASE 5**: Configuration (config.toml, .env, package.json)
**FASE 6**: Documentation & Validation

---

**Status**: ✅ **FASE 3 COMPLETA**
**Data**: 2026-04-11  
**Migration**: `20260411000003_cron_jobs.sql` (20.7 KB)
