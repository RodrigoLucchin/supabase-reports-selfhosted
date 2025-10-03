# Visão Geral

Este documento descreve o processo de criação de um dashboard de monitoramento para uma instância auto-hospedada (self-hosted) do Supabase.

    A página Reports do Supabase, que informa resultados de utilização da API, é uma funcionalidade disponível apenas no serviço em nuvem (Cloud). Ela contém métricas essenciais como:

        * Total de Requisições (Total Requests)
        * Requisições por Segundo (Requests per Second)
        * Erros de Resposta (Response Errors)
        * Velocidade de Resposta (Response Speed)

Para replicar essa funcionalidade em um ambiente auto-hospedado, foi criada uma solução utilizando o Grafana para visualizar as métricas coletadas pelo Prometheus.



# Tecnologias Utilizadas

    * Docker Compose: Para orquestrar os contêineres.
    * Kong: O gateway de API utilizado pelo Supabase.
    * Prometheus: Para coletar e armazenar as métricas.
    * Grafana: Para visualizar os dados em um dashboard.



# Configuração do Ambiente

Siga os passos abaixo para configurar o ambiente de monitoramento.

1. É necessário habilitar o plugin nativo do Prometheus no serviço do Kong para que ele exponha as métricas.
No arquivo docker-compose.yml do seu projeto Supabase, adicione as seguintes variáveis de ambiente ao serviço do kong:
    kong:
        environment:
            KONG_PROMETHEUS_PER_CONSUMER: "false" 
            KONG_PLUGINS: bundled,prometheus 
            KONG_ADMIN_LISTEN: 0.0.0.0:8001
                
2. Adicionar os Serviços do Prometheus e Grafana
Ainda no arquivo docker-compose.yml, adicione os serviços do prometheus e grafana antes da seção final de volumes: 
    prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    volumes:
        - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
        - "9090:9090"

    grafana:
        image: grafana/grafana-oss:latest
        container_name: grafana
        restart: unless-stopped
        volumes:
            - grafana-data:/var/lib/grafana
        ports:
            - "3000:3000"
       
3. Criar o Arquivo de Configuração do Prometheus
O Prometheus precisa de um arquivo de configuração que o instrua sobre quais alvos (targets) monitorar.
    Crie o diretório necessário na raiz do seu projeto Supabase:
        mkdir -p monitoring/prometheus

    Crie o arquivo de configuração dentro do novo diretório:
        touch monitoring/prometheus/prometheus.yml

    Adicione o seguinte conteúdo ao arquivo prometheus.yml:
        global:
            scrape_interval: 15s

        scrape_configs:
        - job_name: 'kong'
            static_configs:
            - targets: ['kong:8001']

4. Aplicar as Mudanças e Verificar os Serviços
    docker compose down
    docker compose up -d

Verifique a conexão com o Prometheus acessando o painel no seu navegador. Você deve conseguir ver o alvo do Kong como "UP".

    URL: http://localhost:9090

Acesse o Grafana pela primeira vez.

    URL: http://localhost:3000

    Utilize o login padrão: admin / admin. Será solicitado que você altere a senha no primeiro acesso.



# Configuração do Grafana

1. Adicionar o Prometheus como Fonte de Dados (Data Source)

    No menu lateral esquerdo, navegue até Connections > Data Sources.
        Clique em "Add new data source" e selecione Prometheus.
            No campo Prometheus server URL, insira http://prometheus:9090.
                Clique em "Save & test" para verificar a conexão.

2. Importar o Dashboard Pré-Configurado

Para evitar a criação manual dos painéis, importaremos um dashboard pronto.
    No menu lateral, navegue até Dashboards.
        Clique no botão New e selecione a opção Import.
            Cole o seguinte JSON na caixa de texto "Import via panel json":
                {
                "__inputs": [
                    {
                    "name": "DS_PROMETHEUS",
                    "label": "Prometheus",
                    "description": "",
                    "type": "datasource",
                    "pluginId": "prometheus",
                    "pluginName": "Prometheus"
                    }
                ],
                "__requires": [
                    {
                    "type": "grafana",
                    "id": "grafana",
                    "name": "Grafana",
                    "version": "10.1.0"
                    },
                    {
                    "type": "datasource",
                    "id": "prometheus",
                    "name": "Prometheus",
                    "version": "1.0.0"
                    }
                ],
                "annotations": {
                    "list": [
                    {
                        "builtIn": 1,
                        "datasource": {
                        "type": "grafana",
                        "uid": "-- Grafana --"
                        },
                        "enable": true,
                        "hide": true,
                        "iconColor": "rgba(0, 211, 255, 1)",
                        "name": "Annotations & Alerts",
                        "type": "dashboard"
                    }
                    ]
                },
                "editable": true,
                "fiscalYearStartMonth": 0,
                "graphTooltip": 0,
                "id": null,
                "links": [],
                "panels": [
                    {
                    "id": 1,
                    "gridPos": { "h": 5, "w": 24, "x": 0, "y": 0 },
                    "type": "stat",
                    "title": "Total Requests",
                    "datasource": { "type": "prometheus", "uid": "${DS_PROMETHEUS}" },
                    "pluginVersion": "10.1.0",
                    "fieldConfig": {
                        "defaults": {
                        "color": { "mode": "thresholds" },
                        "mappings": [],
                        "thresholds": {
                            "mode": "absolute",
                            "steps": [
                            { "color": "green", "value": null },
                            { "color": "red", "value": 80 }
                            ]
                        },
                        "unit": "reqps"
                        },
                        "overrides": []
                    },
                    "options": {
                        "reduceOptions": { "values": false, "calcs": ["lastNotNull"], "fields": "" },
                        "orientation": "auto",
                        "text": { "titleSize": 20 },
                        "textMode": "auto",
                        "colorMode": "value",
                        "graphMode": "area",
                        "justifyMode": "auto"
                    },
                    "targets": [
                        {
                        "datasource": { "type": "prometheus", "uid": "${DS_PROMETHEUS}" },
                        "refId": "A",
                        "expr": "sum(rate(kong_http_status_total[5m]))",
                        "legendFormat": "Requests per second"
                        }
                    ]
                    },
                    {
                    "id": 2,
                    "gridPos": { "h": 9, "w": 24, "x": 0, "y": 5 },
                    "type": "timeseries",
                    "title": "Requests per Second",
                    "datasource": { "type": "prometheus", "uid": "${DS_PROMETHEUS}" },
                    "pluginVersion": "10.1.0",
                    "fieldConfig": {
                        "defaults": {
                        "color": { "mode": "palette-classic" },
                        "custom": {
                            "axisCenteredZero": false, "axisColorMode": "text", "axisLabel": "",
                            "axisPlacement": "auto", "barAlignment": 0, "drawStyle": "line",
                            "fillOpacity": 20, "gradientMode": "opacity", "hideFrom": { "legend": false, "tooltip": false, "viz": false },
                            "lineInterpolation": "smooth", "lineWidth": 2, "pointSize": 5,
                            "scaleDistribution": { "type": "linear" }, "showPoints": "auto", "spanNulls": false,
                            "stacking": { "group": "A", "mode": "normal" }, "thresholdsStyle": { "mode": "off" }
                        },
                        "mappings": [], "thresholds": { "mode": "absolute", "steps": [{ "color": "green", "value": null }, { "color": "red", "value": 80 }] },
                        "unit": "reqps"
                        },
                        "overrides": []
                    },
                    "options": { "legend": { "calcs": [], "displayMode": "list", "placement": "bottom", "showLegend": true }, "tooltip": { "mode": "single", "sort": "none" } }
                    },
                    {
                    "id": 3,
                    "gridPos": { "h": 5, "w": 12, "x": 0, "y": 14 },
                    "type": "stat",
                    "title": "Response Errors (4xx + 5xx)",
                    "datasource": { "type": "prometheus", "uid": "${DS_PROMETHEUS}" },
                    "pluginVersion": "10.1.0",
                    "fieldConfig": {
                        "defaults": {
                        "color": { "mode": "thresholds" },
                        "mappings": [],
                        "thresholds": { "mode": "absolute", "steps": [{ "color": "green", "value": null }, { "color": "#EAB839", "value": 1 }, { "color": "red", "value": 5 }] },
                        "unit": "none"
                        },
                        "overrides": []
                    },
                    "options": {
                        "reduceOptions": { "values": false, "calcs": ["lastNotNull"], "fields": "" },
                        "orientation": "auto",
                        "text": { "titleSize": 20 },
                        "textMode": "auto",
                        "colorMode": "value",
                        "graphMode": "area",
                        "justifyMode": "auto"
                    },
                    "targets": [
                        {
                        "datasource": { "type": "prometheus", "uid": "${DS_PROMETHEUS}" },
                        "refId": "A",
                        "expr": "sum(increase(kong_http_status_total{code=~\"4..|5..\"}[5m]))",
                        "legendFormat": "Total Errors in last 5m"
                        }
                    ]
                    },
                    {
                    "id": 4,
                    "gridPos": { "h": 5, "w": 12, "x": 12, "y": 14 },
                    "type": "stat",
                    "title": "Response Speed (95th Percentile)",
                    "datasource": { "type": "prometheus", "uid": "${DS_PROMETHEUS}" },
                    "pluginVersion": "10.1.0",
                    "fieldConfig": {
                        "defaults": {
                        "color": { "mode": "thresholds" },
                        "mappings": [],
                        "thresholds": { "mode": "absolute", "steps": [{ "color": "green", "value": null }, { "color": "#EAB839", "value": 500 }, { "color": "red", "value": 1000 }] },
                        "unit": "ms"
                        },
                        "overrides": []
                    },
                    "options": {
                        "reduceOptions": { "values": false, "calcs": ["lastNotNull"], "fields": "" },
                        "orientation": "auto",
                        "text": { "titleSize": 20 },
                        "textMode": "auto",
                        "colorMode": "value",
                        "graphMode": "area",
                        "justifyMode": "auto"
                    },
                    "targets": [
                        {
                        "datasource": { "type": "prometheus", "uid": "${DS_PROMETHEUS}" },
                        "refId": "A",
                        "expr": "histogram_quantile(0.95, sum(rate(kong_latency_bucket[5m])) by (le))",
                        "legendFormat": "p95 Latency"
                        }
                    ]
                    }
                ],
                "schemaVersion": 38,
                "style": "dark",
                "tags": ["supabase", "kong"],
                "templating": { "list": [] },
                "time": { "from": "now-1h", "to": "now" },
                "timepicker": {},
                "timezone": "browser",
                "title": "Supabase API Gateway Reports",
                "uid": "your-unique-id",
                "version": 1,
                "weekStart": ""
                }

Após colar o JSON, clique em Load.
    Na próxima tela, você pode alterar o nome do dashboard se desejar e, o mais importante, selecionar a fonte de dados do Prometheus que você criou no passo anterior.
        Clique em Import.



# Conclusão

O dashboard agora está pronto e pode ser acessado através do menu Dashboards. Ele exibirá as métricas da API Supabase em tempo real, de forma similar à página "Reports" da versão em nuvem.