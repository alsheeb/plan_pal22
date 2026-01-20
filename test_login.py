from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome() 
wait = WebDriverWait(driver, 10)  

try:

    driver.get("http://localhost:5000/login")

    email_field = wait.until(EC.presence_of_element_located((By.ID, "email")))
    email_field.send_keys("zaidalsheab@gmail.com")

    password_field = driver.find_element(By.ID, "password")
    password_field.send_keys("200311")

   
    driver.find_element(By.ID, "loginBtn").click()

    message = wait.until(EC.presence_of_element_located((By.ID, "message")))
    success_msg = message.text

    if "Login successful" in success_msg:
        print("✅ Test Passed: Login successful")
    else:
        print("❌ Test Failed: Login message not found")

except Exception as e:
    print("❌ Test Failed:", e)

finally:
    driver.quit()
