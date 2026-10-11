"""End-to-end smoke test against the running app (http://localhost:4000 in production mode)."""
import re, sys, time, random
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:4000"
results = []
def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name)

errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" and "ERR_BLOCKED" not in m.text and "picsum" not in m.text and "Failed to load resource" not in m.text else None)
    page.on("pageerror", lambda e: errors.append(f"PAGEERROR {e}"))

    page.goto(BASE + "/")
    expect(page.get_by_role("heading", name=re.compile("Everything you need"))).to_be_visible()
    check("home hero renders", True)
    page.get_by_role("link", name="Shop Now").first.click()
    page.wait_for_url(re.compile(".*/products$"))
    expect(page.get_by_role("heading", name="All products")).to_be_visible()
    check("Shop Now navigates to products", True)
    expect(page.locator("article").first).to_be_visible()
    check("product cards render", page.locator("article").count() >= 12)

    # search via URL-driven search box
    page.goto(BASE + "/products?search=clean")
    expect(page.get_by_text("Clean Code").first).to_be_visible()
    check("search by name returns matching product", page.locator("article").count() == 1)

    # category + sort filter
    page.goto(BASE + "/products?category=books&sort=price_asc")
    page.wait_for_selector("article")
    prices = page.locator("article p.text-lg").all_inner_texts()
    nums = [float(re.sub(r"[^0-9.]", "", t)) for t in prices]
    check("category filter limits to Books", page.locator("article").count() == 3)
    check("price ascending sort is correct", nums == sorted(nums))

    # product detail + add to cart
    page.goto(BASE + "/products/1")
    expect(page.get_by_role("heading", name=re.compile("Wireless Noise"))).to_be_visible()
    page.get_by_role("button", name="Increase quantity").click()
    page.get_by_role("button", name="Add to cart").click()
    expect(page.get_by_text("Added 2 ×")).to_be_visible()
    check("product detail quantity + add to cart", True)

    page.goto(BASE + "/products/16")
    page.get_by_role("button", name="Add to cart").click()
    page.goto(BASE + "/cart")
    expect(page.get_by_text("Shopping cart")).to_be_visible()
    # Headphones 5999 @25% = 4499.25 x2 = 8998.50 ; Atomic Habits 499 @20% = 399.20 x1 => subtotal 9397.70 free shipping
    body = page.locator("body").inner_text()
    check("cart subtotal correct (9,397.70)", "9,397.70" in body)
    check("free shipping applied above threshold", "Free" in body)

    # increment and decrement: quantity update
    page.get_by_role("button", name="Remove Atomic Habits (Paperback)").click()
    body = page.locator("body").inner_text()
    check("remove item updates totals", "Atomic" not in body and "4,499.25" in body)

    # checkout requires auth
    page.goto(BASE + "/checkout")
    expect(page.get_by_role("heading", name="Sign in")).to_be_visible()
    check("checkout redirects anonymous user to login", True)

    # register
    email = f"qa{random.randint(10000,99999)}@test.dev"
    page.goto(BASE + "/register")
    page.fill("#name", "QA Tester"); page.fill("#email", email); page.fill("#password", "abc")
    page.get_by_role("button", name="Create account").click()
    expect(page.get_by_text("Password must be at least 8 characters")).to_be_visible()
    check("register shows client-side password validation", True)
    page.fill("#password", "Secret123")
    page.get_by_role("button", name="Create account").click()
    expect(page.get_by_role("heading", name="My account")).to_be_visible()
    check("registration logs user in and opens account page", True)

    # checkout validation
    page.goto(BASE + "/checkout")
    page.get_by_role("button", name=re.compile("Place demo order")).click()
    expect(page.get_by_text("Enter a valid phone number").first).to_be_visible()
    check("checkout shows field validation errors", True)
    page.fill("#fullName", "QA Tester"); page.fill("#address", "12 MG Road, Pune"); page.fill("#city", "Pune")
    page.fill("#zip", "411001"); page.fill("#phone", "+91 98765 43210")
    page.get_by_role("button", name=re.compile("Place demo order")).click()
    expect(page.get_by_text("Please confirm that you understand")).to_be_visible()
    check("checkout requires demo acknowledgement", True)
    page.get_by_label("I understand this is a").check()
    page.get_by_role("button", name=re.compile("Place demo order")).click()
    expect(page.get_by_role("heading", name="Order confirmed")).to_be_visible(timeout=10000)
    check("order placed and confirmation shown", True)

    # account history
    page.goto(BASE + "/account")
    expect(page.locator("a[href^='/order-confirmation/']").first).to_be_visible()
    check("order appears in account history (persisted)", True)

    # customer cannot reach admin
    page.goto(BASE + "/admin")
    page.wait_for_url(BASE + "/")
    check("non-admin is redirected away from /admin", True)

    # logout clears session
    page.goto(BASE + "/account")
    page.get_by_role("button", name="Sign out").click()
    page.wait_for_timeout(300)
    check("logout clears session", page.evaluate("localStorage.getItem('shopsphere_token')") is None)

    # admin login + dashboard + product create
    page.goto(BASE + "/login")
    page.fill("#email", "admin@shopsphere.local"); page.fill("#password", "Admin@12345")
    page.get_by_role("button", name="Sign in").click()
    page.wait_for_timeout(800)
    page.goto(BASE + "/admin")
    expect(page.get_by_role("heading", name="Admin dashboard")).to_be_visible()
    check("admin can open dashboard", True)
    page.get_by_role("tab", name="Products").click()
    page.get_by_role("button", name="+ Add product").click()
    page.fill("#p-name", "E2E Test Gadget"); page.fill("#p-price", "1200"); page.fill("#p-stock", "7")
    page.select_option("#p-cat", label="Electronics")
    page.get_by_role("button", name="Save product").click()
    expect(page.get_by_text("E2E Test Gadget").first).to_be_visible(timeout=5000)
    check("admin can create a product (persisted)", True)

    # screenshots for README
    page.goto(BASE + "/")
    page.screenshot(path="/home/claude/shopsphere/e2e/home.png", full_page=False)
    page.goto(BASE + "/products")
    page.screenshot(path="/home/claude/shopsphere/e2e/products.png", full_page=False)

    # mobile responsive check
    m = browser.new_page(viewport={"width": 390, "height": 844})
    m.goto(BASE + "/")
    overflow = m.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
    check("mobile layout has no horizontal overflow", not overflow)
    m.screenshot(path="/home/claude/shopsphere/e2e/mobile.png")

    browser.close()

print("\nConsole/page errors:", errors if errors else "none")
passed = sum(1 for _, ok in results if ok)
print(f"\n{passed}/{len(results)} checks passed")
sys.exit(0 if passed == len(results) else 1)
