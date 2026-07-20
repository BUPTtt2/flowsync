import re
path = r"d:\Appt\大三下\Trae赛2\P人push\flowsync\web\app.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r'\s+<!-- ============ VOICE INPUT ============ -->\s+<div class="view" id="view-voice">.*?</div>\s+', '\n', content, flags=re.DOTALL)
content = re.sub(r'\s+<!-- ============ FOCUS MODE ============ -->\s+<div class="view" id="view-focus">.*?</div>\s+', '\n', content, flags=re.DOTALL)
content = re.sub(r'\s+<!-- ============ MOOD ============ -->\s+<div class="view" id="view-mood">.*?</div>\s+', '\n', content, flags=re.DOTALL)
content = re.sub(r'\s+<!-- ============ TIMEBLOCK 时间盲区 ============ -->\s+<div class="view" id="view-timeblock">.*?</div>\s+', '\n', content, flags=re.DOTALL)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print('deleted')
