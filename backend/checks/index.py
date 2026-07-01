import json
import os
import psycopg2

SCHEMA = 't_p66221996_checklist_restaurant'

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """CRUD для завершённых проверок: GET — список, POST — сохранить, DELETE — удалить."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f'SELECT id, title, zone, score, by_name, restaurant, month, time_str, issues, fine, ok_count, total_count, items_detail '
            f'FROM {SCHEMA}.completed_checks ORDER BY created_at DESC'
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        checks = []
        for r in rows:
            checks.append({
                'id': r[0],
                'title': r[1],
                'zone': r[2],
                'score': float(r[3]),
                'by': r[4],
                'restaurant': r[5],
                'month': r[6],
                'time': r[7],
                'issues': r[8],
                'fine': r[9],
                'okCount': r[10],
                'totalCount': r[11],
                'itemsDetail': r[12],
            })
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps(checks, ensure_ascii=False)}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        c = body
        items_detail = json.dumps(c.get('itemsDetail'), ensure_ascii=False) if c.get('itemsDetail') else None
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f'INSERT INTO {SCHEMA}.completed_checks '
            f'(id, title, zone, score, by_name, restaurant, month, time_str, issues, fine, ok_count, total_count, items_detail) '
            f'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING',
            (
                c['id'], c['title'], c['zone'], c['score'], c['by'],
                c['restaurant'], c['month'], c['time'], c['issues'],
                c.get('fine'), c.get('okCount'), c.get('totalCount'), items_detail,
            )
        )
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    if method == 'DELETE':
        params = event.get('queryStringParameters') or {}
        check_id = params.get('id')
        if not check_id:
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'id required'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f'DELETE FROM {SCHEMA}.completed_checks WHERE id = %s', (int(check_id),))
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'method not allowed'})}
