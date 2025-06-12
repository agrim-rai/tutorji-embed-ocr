import os
import pickle
from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain.embeddings import OpenAIEmbeddings
import faiss
import numpy as np
from dotenv import load_dotenv
from langchain.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS



# — load env
load_dotenv()  
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PERSIST_DIR = Path(os.getenv("PERSIST_DIR", "./store"))
PERSIST_DIR.mkdir(exist_ok=True)

# — FAISS settings
DIM = 1536   # text-embedding-ada-002 output dimension
INDEX_FILE = PERSIST_DIR / "faiss.index"
META_FILE  = PERSIST_DIR / "meta.pkl"

# — global state
app = FastAPI()
embeddings = OpenAIEmbeddings()  # reads OPENAI_API_KEY
# We hold a single IndexFlatL2 in memory + a Python list for metadata
if INDEX_FILE.exists():
    index = faiss.read_index(str(INDEX_FILE))
else:
    index = faiss.IndexFlatL2(DIM)

if META_FILE.exists():
    with open(META_FILE, "rb") as f:
        metadata = pickle.load(f)
else:
    metadata = []

# — request models
class Doc(BaseModel):
    id: str
    text: str

class AddDocsRequest(BaseModel):
    docs: list[Doc]

class QueryRequest(BaseModel):
    q: str
    k: int = 3

# — helpers to persist
def persist():
    faiss.write_index(index, str(INDEX_FILE))
    with open(META_FILE, "wb") as f:
        pickle.dump(metadata, f)

# — API routes
@app.post("/add_docs")
async def add_docs(req: AddDocsRequest):
    texts = [d.text for d in req.docs]
    if not texts:
        raise HTTPException(status_code=400, detail="Empty docs array")
    # 1) embed
    vectors = embeddings.embed_documents(texts)  # List[List[float]]
    arr = np.array(vectors, dtype="float32")
    # 2) add to FAISS
    index.add(arr)
    # 3) record metadata
    for d in req.docs:
        metadata.append({"id": d.id, "text": d.text})
    # 4) persist to disk
    persist()
    return {"added": len(req.docs)}

@app.post("/query")
async def query(req: QueryRequest):
    if not req.q:
        raise HTTPException(status_code=400, detail="Empty query")
    # embed the query
    qvec = embeddings.embed_query(req.q)
    xq = np.array([qvec], dtype="float32")
    # search top-k
    D, I = index.search(xq, req.k)
    hits = []
    for idx in I[0]:
        if idx < len(metadata):  # safety
            hits.append(metadata[idx])
    return {"hits": hits, "distances": D[0].tolist()}

# — run with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)