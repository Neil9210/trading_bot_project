class Wallet:
    def __init__(self, balance=100000):
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount
        return f"Deposited ₹{amount}. Balance: ₹{self.balance}"

    def withdraw(self, amount):
        if amount > self.balance:
            return "Insufficient balance"
        self.balance -= amount
        return f"Withdrew ₹{amount}. Balance: ₹{self.balance}"

    def get_balance(self):
        return self.balance


wallet = Wallet()

def buy_stock(price, quantity):
    total = price * quantity
    if wallet.get_balance() >= total:
        wallet.withdraw(total)
        return f"Bought {quantity} stocks at ₹{price}"
    else:
        return "Not enough balance"

def sell_stock(price, quantity):
    total = price * quantity
    wallet.deposit(total)
    return f"Sold {quantity} stocks at ₹{price}"
