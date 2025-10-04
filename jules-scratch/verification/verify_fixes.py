from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.goto("http://localhost:5173/")

    # Wait for the "Semua Produk" heading to be visible.
    # This is a more robust locator than a long chain of CSS classes.
    heading = page.get_by_role("heading", name="Semua Produk")
    expect(heading).to_be_visible()

    page.screenshot(path="jules-scratch/verification/verification.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)