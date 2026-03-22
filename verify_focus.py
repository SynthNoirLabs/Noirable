from playwright.sync_api import sync_playwright

def verify_feature():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/video")
        page = context.new_page()

        try:
            print("Navigating to local server...")
            page.goto("http://localhost:3000", timeout=60000)
            print("Page loaded. Waiting for compilation...")
            page.wait_for_timeout(2000)

            print("Focusing on 'Show editor' button...")
            page.locator('button[aria-label="Hide editor"]').focus()
            page.wait_for_timeout(1000)
            page.screenshot(path="/home/jules/verification/focus_editor.png")

            print("Focusing on 'Training' button...")
            page.locator('button[title="Training data archive"]').focus()
            page.wait_for_timeout(1000)
            page.screenshot(path="/home/jules/verification/focus_training.png")

            print("Focusing on 'Templates' button...")
            page.locator('button[title="Browse templates"]').focus()
            page.wait_for_timeout(1000)
            page.screenshot(path="/home/jules/verification/focus_templates.png")

            print("Focusing on 'Eject' button...")
            page.locator('button[title^="Export to code"]').focus()
            page.wait_for_timeout(1000)
            page.screenshot(path="/home/jules/verification/focus_eject.png")

            print("Verification complete.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    verify_feature()
