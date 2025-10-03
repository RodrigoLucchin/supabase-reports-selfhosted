# Overview

This document describes the process of creating a monitoring dashboard for a self-hosted Supabase instance.

    The Supabase Reports page, which informs API use results, is a functionality available only in cloud service. It contains essential metrics such as:

        * Total requests (Total Requests)
        * Requisitions per second (Per Perdond Requests)
        * Response errors (Response Errors)
        * Response Speed ​​(Response Speed)

To replicate this functionality in a self-hospital environment, a solution was created using the graph to view the metrics collected by Prometheus.



# Technologies used

    * Docker Composis: To orchestrate containers.
    * Kong: The API gateway used by supabase.
    * Prometheus: to collect and store the metrics.
    * Graphana: To view the data on a dashboard.



# Environment Configuration

Follow the steps below to configure the monitoring environment.

1. It is necessary to enable Prometheus's native plugin in the Kong service to expose the metrics.
In the Docker-Compose.YML file of your SUPABASE project, add the following environment variables to the service of Kong:
    kong:
        environment:
            KONG_PROMETHEUS_PER_CONSUMER: "false" 
            KONG_PLUGINS: bundled,prometheus 
            KONG_ADMIN_LISTEN: 0.0.0.0:8001
                
2. Add the services of Prometheus and Grafana
Still in the Docker-Compose.YML file, add the Prometheus and Graphana services before the final section of volumes:
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
       
3. Create the Prometheus configuration file
Prometheus needs a configuration file that instructs it on which targets to monitor.
    Create the necessary directory at the root of your SUPABASE project:
        mkdir -p monitoring/prometheus

Create the configuration file within the new directory:
        touch monitoring/prometheus/prometheus.yml

Add the following content to the Prometheus.yml file:
        global:
            scrape_interval: 15s

        scrape_configs:
        - job_name: 'kong'
            static_configs:
            - targets: ['kong:8001']

4. Apply the changes and check the services
    docker compose down
    docker compose up -d

Check the connection with Prometheus by accessing the panel to your browser. You should be able to see the Kong target as "Up".

    URL: http://localhost:9090

Access the graph for the first time.

    URL: http://localhost:3000

Use the Standard Login: Admin / Admin. You will be asked to change the password on the first access.



# Grafan Configuration

1. Add Prometheus as a data source (Data Source)

    In the left side menu, navigate to Connections> Data Source.
        Click on "Add New Data Source" and select Prometheus.
            In the Prometheus server URL field, enter http://prometheus:9090.
                Click "Save & test" to check the connection.

2. Import the Pre-Configured Dashboard

To avoid manually creating dashboards, we will import a ready-made dashboard.
    In the side menu, navigate to Dashboards.
        Click the New button and select the Import option.
            Paste the following JSON into the "Import via panel json" text box:
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

After pasting the JSON, click Load.
    On the next screen, you can change the dashboard name if you wish and, most importantly, select the Prometheus data source you created in the previous step.
        Click on Import.



# Conclusion

The dashboard is now ready and can be accessed through the Dashboards menu. It will display Supabase API metrics in real time, similar to the "Reports" page in the cloud version.