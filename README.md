# Kurulum Adımları

- ### Backend Kurulum:
---
``` bash
cd gamesatis/backend
```
``` bash
source venv/bin/activate
```
``` bash
pip install -r requirements.txt
```
``` bash
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```
---
- ### Frondtend Kurulumu
---
``` bash
cd gamesatis/frontend
```
``` bash
sudo dpkg --configure -a
```
``` bash
sudo apt update
```
``` bash
sudo apt install -f
```
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```
``` bash
apt install npm
```
``` bash
npm install
```
``` bash
npm run build
```
``` bash
npm start
```
