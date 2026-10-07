#!/usr/bin/env python3
"""Tuỳ biến project Android do `npx cap add android` sinh ra:
 - khoá màn hình dọc, toàn màn hình (immersive), tràn tai thỏ
 - icon launcher từ icons/icon-512.png
 - versionName/versionCode
Chạy lại nhiều lần vẫn an toàn (idempotent)."""
import json, os, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AND = ROOT / "android"
if not AND.exists():
    sys.exit("Chưa có thư mục android/. Chạy: npx cap add android")

pkg = json.load(open(ROOT / "package.json", encoding="utf-8"))
cfg = json.load(open(ROOT / "capacitor.config.json", encoding="utf-8"))
app_id = cfg["appId"]
version_name = pkg["version"]
version_code = int(os.environ.get("VERSION_CODE") or os.environ.get("GITHUB_RUN_NUMBER") or 1)

# ---------- AndroidManifest: dọc + cấu hình ----------
mf = AND / "app/src/main/AndroidManifest.xml"
t = mf.read_text(encoding="utf-8")
if 'android:screenOrientation' not in t:
    t = t.replace("<activity", '<activity\n            android:screenOrientation="portrait"', 1)
t = t.replace("android:allowBackup=\"true\"", "android:allowBackup=\"true\"")
mf.write_text(t, encoding="utf-8")

# ---------- styles (API 28+): tràn tai thỏ ----------
v28 = AND / "app/src/main/res/values-v28"
v28.mkdir(parents=True, exist_ok=True)
(v28 / "styles.xml").write_text("""<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@null</item>
        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
    </style>
</resources>
""", encoding="utf-8")

# ---------- MainActivity: immersive sticky ----------
java_dir = AND / "app/src/main/java" / Path(*app_id.split("."))
java_dir.mkdir(parents=True, exist_ok=True)
(java_dir / "MainActivity.java").write_text(f"""package {app_id};

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {{
    @Override
    public void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemBars();
    }}

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {{
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }}

    private void hideSystemBars() {{
        View decor = getWindow().getDecorView();
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), decor);
        if (c != null) {{
            c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            c.hide(androidx.core.view.WindowInsetsCompat.Type.systemBars());
        }}
    }}
}}
""", encoding="utf-8")

# ---------- Icon launcher ----------
res = AND / "app/src/main/res"
try:
    from PIL import Image
    src = Image.open(ROOT / "icons/icon-512.png").convert("RGBA")
    sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    for d, px in sizes.items():
        out = res / f"mipmap-{d}"
        out.mkdir(parents=True, exist_ok=True)
        im = src.resize((px, px), Image.LANCZOS)
        for n in ("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"):
            im.save(out / n)
    # dùng PNG thường thay cho adaptive icon mặc định của Capacitor
    shutil.rmtree(res / "mipmap-anydpi-v26", ignore_errors=True)
    for p in res.glob("drawable*/ic_launcher_foreground.xml"):
        p.unlink()
    for p in res.glob("drawable*/ic_launcher_background.xml"):
        p.unlink()
    print("Icon: OK")
except ImportError:
    print("Cảnh báo: thiếu Pillow (pip install pillow) -> giữ icon mặc định Capacitor")

# ---------- Version ----------
gr = AND / "app/build.gradle"
g = gr.read_text(encoding="utf-8")
g = re.sub(r"versionCode\s+\d+", f"versionCode {version_code}", g)
g = re.sub(r'versionName\s+"[^"]*"', f'versionName "{version_name}"', g)
gr.write_text(g, encoding="utf-8")
print(f"Patch xong: {app_id} v{version_name} ({version_code})")
