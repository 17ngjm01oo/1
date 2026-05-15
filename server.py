from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import Request, urlopen
import json


HOST = "127.0.0.1"
PORT = 8001
IMF_BASE_URL = "https://www.imf.org/external/datamapper/api/v2"


class AppRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_url = urlparse(self.path)

        if parsed_url.path == "/api/imf":
            self.handle_imf_proxy(parsed_url)
            return

        super().do_GET()

    def handle_imf_proxy(self, parsed_url):
        query = parse_qs(parsed_url.query)
        indicator_code = get_first(query, "indicatorCode")
        country_code = get_first(query, "countryCode")
        start_year = get_first(query, "startYear")
        end_year = get_first(query, "endYear")

        if not indicator_code or not country_code:
            self.send_json(
                400,
                {
                    "error": "indicatorCode and countryCode are required.",
                    "query": query,
                },
            )
            return

        remote_url = build_imf_url(indicator_code, country_code, start_year, end_year)
        print(f"[IMF Proxy] Requesting: {remote_url}")

        try:
            request = Request(remote_url, headers={"Accept": "application/json"})

            with urlopen(request, timeout=30) as response:
                body = response.read()
                parsed_body = json.loads(body.decode("utf-8"))

            print("[IMF Proxy] Raw response keys:", list(parsed_body.keys()))
            self.send_json(200, parsed_body)
        except HTTPError as error:
            error_body = error.read().decode("utf-8", errors="replace")
            print("[IMF Proxy] HTTPError:", error.code, error_body[:1000])
            self.send_json(
                error.code,
                {
                    "error": "IMF API returned an HTTP error.",
                    "remoteUrl": remote_url,
                    "status": error.code,
                    "details": error_body,
                },
            )
        except (URLError, TimeoutError, json.JSONDecodeError) as error:
            print("[IMF Proxy] Fetch or parse error:", repr(error))
            self.send_json(
                502,
                {
                    "error": "Failed to fetch or parse IMF API response.",
                    "remoteUrl": remote_url,
                    "details": repr(error),
                },
            )

    def send_json(self, status_code, payload):
        body = json.dumps(payload).encode("utf-8")

        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def get_first(query, key):
    values = query.get(key)
    return values[0] if values else None


def build_imf_url(indicator_code, country_code, start_year, end_year):
    query = {}

    if start_year and end_year:
        try:
            years = range(int(start_year), int(end_year) + 1)
            query["periods"] = ",".join(str(year) for year in years)
        except ValueError:
            print("[IMF Proxy] Invalid year range. Fetching without periods filter.")

    query_string = urlencode(query)
    path = f"{IMF_BASE_URL}/{indicator_code}/{country_code}"

    return f"{path}?{query_string}" if query_string else path


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), AppRequestHandler)
    print(f"Serving on http://{HOST}:{PORT}")
    server.serve_forever()
