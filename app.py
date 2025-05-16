from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)
CORS(app, origins=["https://redslugah.github.io"])

DB_PATH = 'pxg_log.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return 'PXG API online. Use /market ou /market/hist.'

@app.route('/market')
def get_market_vigente():
    conn = get_db_connection()
    cursor = conn.execute('SELECT * FROM PVIMARKET ORDER BY PVICRDATE DESC')
    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(results)

@app.route('/market/hist')
def get_market_historico():
    conn = get_db_connection()
    cursor = conn.execute('SELECT * FROM PHIMARKET ORDER BY PHICRDATE DESC')
    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(results)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)