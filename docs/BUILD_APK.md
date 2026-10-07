# Đóng gói APK bằng GitHub Actions

Game là web tĩnh (HTML/JS) → bọc bằng **Capacitor** thành app Android. Toàn bộ chạy trên GitHub, không cần cài Android Studio.

## 1. Lấy APK nhanh nhất (debug)
1. Đẩy toàn bộ project lên GitHub (nhánh `main`).
2. Vào tab **Actions → Build Android APK** (tự chạy khi push, hoặc bấm *Run workflow*).
3. Chạy xong (~5–8 phút) → kéo xuống **Artifacts** → tải `dai-viet-chay-di-apk` → giải nén lấy `dai-viet-chay-di-debug.apk` → cài lên điện thoại (bật *Cài app không rõ nguồn gốc*).

> APK debug dùng khoá debug sinh ngẫu nhiên mỗi lần build → **bản sau không cài đè được bản trước** (phải gỡ rồi cài lại, mất save). Muốn cài đè/nâng cấp được, hãy ký release (mục 2).

## 2. APK release có chữ ký cố định (khuyên dùng)
Tạo keystore **một lần** (giữ file này cẩn thận, mất là không cập nhật app được):
```bash
keytool -genkeypair -v -keystore dvcd.keystore -alias dvcd \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 dvcd.keystore > keystore.b64      # macOS: base64 -i dvcd.keystore -o keystore.b64
```
Vào **Settings → Secrets and variables → Actions → New repository secret**, thêm 4 secret:

| Secret | Giá trị |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | nội dung file `keystore.b64` |
| `ANDROID_KEYSTORE_PASSWORD` | mật khẩu keystore |
| `ANDROID_KEY_ALIAS` | `dvcd` |
| `ANDROID_KEY_PASSWORD` | mật khẩu key |

Từ lần build sau, Artifacts có thêm `dai-viet-chay-di-release.apk` (đã ký, tối ưu zipalign).

## 3. Phát hành lên GitHub Releases
```bash
git tag v2.5.0 && git push origin v2.5.0
```
Workflow tự đính kèm các APK vào trang **Releases**.

## Ghi chú
- `versionName` lấy từ `package.json`, `versionCode` = số lần chạy workflow (luôn tăng).
- Đổi tên gói (`vn.daiviet.chaydi`) / tên app trong `capacitor.config.json` **trước khi** phát hành.
- Thư mục `android/` và `www/` được sinh trong CI, không commit (đã có trong `.gitignore`). `www/` chỉ chứa file chạy game (không có `tests/`, `docs/`).
- App khoá màn hình dọc, ẩn thanh hệ thống (vuốt cạnh để hiện), giữ màn hình sáng.
- Save lưu bằng `localStorage` của WebView: xoá dữ liệu app là mất save. Game và Admin cùng origin nên dùng chung dữ liệu.
- Build thử trên máy: `npm install && npm run android:add && npm run android:debug` (cần JDK 17 + Android SDK).
- Muốn lên Google Play cần AAB: đổi bước build thành `./gradlew bundleRelease` rồi ký bằng `jarsigner`.
