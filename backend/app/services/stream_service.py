import httpx
import logging
import asyncio
import time
from typing import Dict, Any, List, Optional
from fastapi.responses import StreamingResponse, Response

logger = logging.getLogger(__name__)

CANDIDATE_PATHS = ["/stream.mjpg", "/video", "/video_feed", "/stream", "", "/live", "/shot.jpg"]

class StreamService:
    def __init__(self):
        self.active_stream_url = "http://raspberry.local:8080/stream.mjpg"

    async def check_stream(self, target_url: str) -> Dict[str, Any]:
        """
        Tests connectivity to a camera stream host and checks common stream endpoints.
        """
        from urllib.parse import urlparse
        parsed = urlparse(target_url)
        base_origin = f"{parsed.scheme}://{parsed.netloc}" if parsed.netloc else target_url.rstrip("/")
        start_time = time.time()
        
        results: Dict[str, Any] = {
            "target": target_url,
            "is_reachable": False,
            "latency_ms": None,
            "working_endpoint": None,
            "candidate_status": {},
            "details": ""
        }

        # Build list of URLs to test: target_url itself first, then candidate paths on base_origin
        test_urls = [target_url]
        for path in CANDIDATE_PATHS:
            cand = f"{base_origin}{path}" if path else base_origin
            if cand not in test_urls:
                test_urls.append(cand)

        async with httpx.AsyncClient(timeout=2.0) as client:
            for test_url in test_urls:
                try:
                    res = await client.get(test_url, timeout=1.5)
                    results["candidate_status"][test_url] = {
                        "status_code": res.status_code,
                        "content_type": res.headers.get("content-type", "unknown")
                    }
                    if res.status_code == 200:
                        results["is_reachable"] = True
                        if not results["working_endpoint"]:
                            results["working_endpoint"] = test_url
                            results["latency_ms"] = round((time.time() - start_time) * 1000, 1)
                except httpx.ConnectTimeout:
                    results["candidate_status"][test_url] = {"error": "Connection timed out"}
                except httpx.ConnectError:
                    results["candidate_status"][test_url] = {"error": "Host connection failed (unreachable)"}
                except Exception as e:
                    results["candidate_status"][test_url] = {"error": str(e)}

        if results["is_reachable"]:
            results["details"] = f"Online. Best stream endpoint: {results['working_endpoint']}"
        else:
            results["details"] = "Offline or unreachable. Ensure device is on the same WiFi/hotspot and stream server is started."

        return results

    async def generate_stream_proxy(self, target_url: str):
        """
        Streams MJPEG frames from the target camera stream.
        """
        headers = {
            "User-Agent": "DriveSafe-Edge-Stream-Proxy/1.0",
            "Accept": "*/*"
        }
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream("GET", target_url, headers=headers) as response:
                    async for chunk in response.aiter_bytes():
                        yield chunk
        except Exception as e:
            logger.warning(f"Stream proxy interrupted for {target_url}: {e}")
            # Yield fallback SVG frame indicating disconnection
            fallback_svg = self._create_fallback_svg(target_url, str(e))
            yield fallback_svg.encode("utf-8")

    def _create_fallback_svg(self, url: str, error_msg: str) -> str:
        return f"""
        <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
            <rect width="640" height="360" fill="#070b14"/>
            <path d="M 40 360 Q 240 240 280 100 L 360 100 Q 340 240 600 360" fill="#111827"/>
            <circle cx="320" cy="150" r="40" fill="#1e293b" stroke="#f87171" stroke-width="2"/>
            <text x="320" y="157" fill="#f87171" font-size="28" font-family="sans-serif" text-anchor="middle">✕</text>
            <text x="320" y="225" fill="#f8fafc" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">CAMERA STREAM STANDBY</text>
            <text x="320" y="250" fill="#94a3b8" font-size="12" font-family="monospace" text-anchor="middle">{url}</text>
            <text x="320" y="275" fill="#64748b" font-size="11" font-family="sans-serif" text-anchor="middle">Awaiting live frames • Check IP webcam or phone hotspot connection</text>
        </svg>
        """

stream_service = StreamService()
