from supabase import create_client, Client
from ..config import settings
import logging

logger = logging.getLogger(__name__)

supabase_client: Client | None = None

def get_supabase() -> Client | None:
    global supabase_client
    if supabase_client is not None:
        return supabase_client
        
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_KEY
    
    if url and key:
        try:
            supabase_client = create_client(url, key)
            logger.info("Supabase client initialized successfully.")
            return supabase_client
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None
    else:
        logger.warning("Supabase URL or Key not set. Running with local in-memory store.")
        return None
