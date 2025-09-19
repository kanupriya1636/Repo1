import { Chart } from "@/components/ui/chart"
// Expense Tracker Application - Frontend Only
class ExpenseTracker {
  constructor() {
    this.expenses = []
    this.charts = {}
    this.editingExpense = null
    this.categories = {
      food: { name: "Food & Dining", icon: "🍎", color: "#FF6B6B" },
      transport: { name: "Transportation", icon: "🚗", color: "#4ECDC4" },
      shopping: { name: "Shopping", icon: "🛍️", color: "#45B7D1" },
      entertainment: { name: "Entertainment", icon: "🎬", color: "#96CEB4" },
      bills: { name: "Bills & Utilities", icon: "💡", color: "#FFEAA7" },
      health: { name: "Healthcare", icon: "🏥", color: "#DDA0DD" },
      other: { name: "Other", icon: "📦", color: "#98D8C8" },
    }
    this.init()
  }

  init() {
    this.loadExpenses()
    this.bindEvents()
    this.initializeCharts()
    this.updateDashboard()
    this.setDefaultDate()
    this.initializeTheme()
  }

  // Data Management
  loadExpenses() {
    try {
      const stored = localStorage.getItem("expenses")
      this.expenses = stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error loading expenses:", error)
      this.expenses = []
    }
  }

  saveExpenses() {
    try {
      localStorage.setItem("expenses", JSON.stringify(this.expenses))
      this.showSuccess("Expenses saved successfully!")
    } catch (error) {
      console.error("Error saving expenses:", error)
      this.showError("Failed to save expenses")
    }
  }

  // CRUD Operations
  addExpense(expenseData) {
    const expense = {
      id: this.generateId(),
      ...expenseData,
      amount: Number.parseFloat(expenseData.amount),
      createdAt: new Date().toISOString(),
    }

    this.expenses.unshift(expense)
    this.saveExpenses()
    this.updateDashboard()
    this.renderExpenses()
    this.updateCharts()
    this.showSuccess("Expense added successfully!")
    return expense
  }

  updateExpense(id, updates) {
    const index = this.expenses.findIndex((exp) => exp.id === id)
    if (index !== -1) {
      this.expenses[index] = {
        ...this.expenses[index],
        ...updates,
        amount: Number.parseFloat(updates.amount),
        updatedAt: new Date().toISOString(),
      }
      this.saveExpenses()
      this.updateDashboard()
      this.renderExpenses()
      this.updateCharts()
      this.showSuccess("Expense updated successfully!")
      return this.expenses[index]
    }
    return null
  }

  deleteExpense(id) {
    const index = this.expenses.findIndex((exp) => exp.id === id)
    if (index !== -1) {
      this.expenses.splice(index, 1)
      this.saveExpenses()
      this.updateDashboard()
      this.renderExpenses()
      this.updateCharts()
      this.showSuccess("Expense deleted successfully!")
      return true
    }
    return false
  }

  // Statistics
  calculateSummary() {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const thisMonthExpenses = this.expenses.filter((exp) => {
      const expDate = new Date(exp.date)
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
    })

    const lastMonthExpenses = this.expenses.filter((exp) => {
      const expDate = new Date(exp.date)
      return expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear
    })

    const totalExpenses = this.expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const thisMonthTotal = thisMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0)

    const monthlyChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const dailyAverage = thisMonthTotal / daysInMonth
    const categories = [...new Set(this.expenses.map((exp) => exp.category))]

    return {
      totalExpenses,
      thisMonthTotal,
      monthlyChange,
      dailyAverage,
      categoryCount: categories.length,
    }
  }

  // UI Updates
  updateDashboard() {
    const summary = this.calculateSummary()

    document.getElementById("total-expenses").textContent = this.formatCurrency(summary.totalExpenses)
    document.getElementById("month-expenses").textContent = this.formatCurrency(summary.thisMonthTotal)
    document.getElementById("daily-average").textContent = this.formatCurrency(summary.dailyAverage)
    document.getElementById("category-count").textContent = summary.categoryCount

    this.updateChangeIndicator("total-change", summary.monthlyChange)
    this.updateChangeIndicator("month-change", summary.monthlyChange)
    this.updateChangeIndicator("daily-change", summary.monthlyChange)
  }

  updateChangeIndicator(elementId, change) {
    const element = document.getElementById(elementId)
    const absChange = Math.abs(change)
    const sign = change >= 0 ? "+" : "-"

    element.textContent = `${sign}${absChange.toFixed(1)}%`
    element.className = "change-indicator"

    if (change > 0) {
      element.classList.add("negative")
    } else if (change < 0) {
      element.classList.add("positive")
    }
  }

  renderExpenses() {
    const expenseList = document.getElementById("expense-list")
    const filteredExpenses = this.getFilteredExpenses()

    if (filteredExpenses.length === 0) {
      expenseList.innerHTML = `
                <div class="empty-state">
                    <p>No expenses found. ${this.expenses.length === 0 ? "Add your first expense to get started! 🚀" : "Try adjusting your filters."}</p>
                </div>
            `
      return
    }

    expenseList.innerHTML = filteredExpenses
      .map(
        (expense) => `
            <div class="expense-item" data-id="${expense.id}">
                <div class="expense-info">
                    <div class="expense-description">${this.escapeHtml(expense.description)}</div>
                    <div class="expense-meta">
                        <span class="expense-category" style="background-color: ${this.categories[expense.category]?.color}20; color: ${this.categories[expense.category]?.color}">
                            ${this.categories[expense.category]?.icon} ${this.categories[expense.category]?.name}
                        </span>
                        <span class="expense-date">${this.formatDate(expense.date)}</span>
                    </div>
                </div>
                <div class="expense-amount">${this.formatCurrency(expense.amount)}</div>
                <div class="expense-actions">
                    <button class="edit-btn" onclick="expenseTracker.editExpense('${expense.id}')">Edit</button>
                    <button class="delete-btn" onclick="expenseTracker.confirmDelete('${expense.id}')">Delete</button>
                </div>
            </div>
        `,
      )
      .join("")
  }

  getFilteredExpenses() {
    let filtered = [...this.expenses]

    const searchTerm = document.getElementById("search-input").value.toLowerCase()
    if (searchTerm) {
      filtered = filtered.filter(
        (exp) => exp.description.toLowerCase().includes(searchTerm) || exp.category.toLowerCase().includes(searchTerm),
      )
    }

    const categoryFilter = document.getElementById("category-filter").value
    if (categoryFilter) {
      filtered = filtered.filter((exp) => exp.category === categoryFilter)
    }

    const dateFilter = document.getElementById("date-filter").value
    if (dateFilter) {
      filtered = filtered.filter((exp) => exp.date === dateFilter)
    }

    return filtered
  }

  // Chart Management
  initializeCharts() {
    this.initTrendsChart()
    this.initCategoryChart()
    this.initComparisonChart()
  }

  initTrendsChart() {
    const ctx = document.getElementById("trends-chart").getContext("2d")
    this.charts.trends = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Daily Expenses",
            data: [],
            borderColor: "#0891b2",
            backgroundColor: "rgba(8, 145, 178, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => "$" + value.toFixed(0),
            },
          },
        },
      },
    })
  }

  initCategoryChart() {
    const ctx = document.getElementById("category-chart").getContext("2d")
    this.charts.category = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    })
  }

  initComparisonChart() {
    const ctx = document.getElementById("comparison-chart").getContext("2d")
    this.charts.comparison = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Monthly Expenses",
            data: [],
            backgroundColor: "#f97316",
            borderColor: "#ea580c",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => "$" + value.toFixed(0),
            },
          },
        },
      },
    })
  }

  updateCharts() {
    this.updateTrendsChart()
    this.updateCategoryChart()
    this.updateComparisonChart()
  }

  updateTrendsChart() {
    const last30Days = this.getLast30DaysData()
    this.charts.trends.data.labels = last30Days.labels
    this.charts.trends.data.datasets[0].data = last30Days.data
    this.charts.trends.update()
  }

  updateCategoryChart() {
    const categoryData = this.getCategoryBreakdown()
    const labels = Object.keys(categoryData)
    const data = Object.values(categoryData)
    const colors = labels.map((cat) => this.categories[cat]?.color || "#98D8C8")

    this.charts.category.data.labels = labels.map((cat) => this.categories[cat]?.name || cat)
    this.charts.category.data.datasets[0].data = data
    this.charts.category.data.datasets[0].backgroundColor = colors
    this.charts.category.update()
  }

  updateComparisonChart() {
    const monthlyData = this.getMonthlyData()
    this.charts.comparison.data.labels = monthlyData.labels
    this.charts.comparison.data.datasets[0].data = monthlyData.data
    this.charts.comparison.update()
  }

  getLast30DaysData() {
    const labels = []
    const data = []
    const today = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      labels.push(date.toLocaleDateString("en-US", { month: "short", day: "numeric" }))

      const dayExpenses = this.expenses.filter((exp) => exp.date === dateStr).reduce((sum, exp) => sum + exp.amount, 0)

      data.push(dayExpenses)
    }

    return { labels, data }
  }

  getCategoryBreakdown() {
    const breakdown = {}
    this.expenses.forEach((exp) => {
      if (!breakdown[exp.category]) {
        breakdown[exp.category] = 0
      }
      breakdown[exp.category] += exp.amount
    })
    return breakdown
  }

  getMonthlyData() {
    const monthlyData = {}
    this.expenses.forEach((exp) => {
      const date = new Date(exp.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0
      }
      monthlyData[monthKey] += exp.amount
    })

    const sortedMonths = Object.keys(monthlyData).sort().slice(-6)
    const labels = sortedMonths.map((month) => {
      const [year, monthNum] = month.split("-")
      return new Date(year, monthNum - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    })
    const data = sortedMonths.map((month) => monthlyData[month])

    return { labels, data }
  }

  // Modal Management
  openAddExpenseModal() {
    this.editingExpense = null
    document.getElementById("modal-title").textContent = "Add Expense"
    document.getElementById("expense-form").reset()
    this.setDefaultDate()
    document.getElementById("expense-modal").classList.remove("hidden")
    document.getElementById("expense-description").focus()
  }

  editExpense(id) {
    const expense = this.expenses.find((exp) => exp.id === id)
    if (!expense) return

    this.editingExpense = expense
    document.getElementById("modal-title").textContent = "Edit Expense"
    document.getElementById("expense-description").value = expense.description
    document.getElementById("expense-amount").value = expense.amount
    document.getElementById("expense-category").value = expense.category
    document.getElementById("expense-date").value = expense.date
    document.getElementById("expense-modal").classList.remove("hidden")
    document.getElementById("expense-description").focus()
  }

  closeModal() {
    document.getElementById("expense-modal").classList.add("hidden")
    this.editingExpense = null
  }

  confirmDelete(id) {
    if (confirm("Are you sure you want to delete this expense?")) {
      this.deleteExpense(id)
    }
  }

  // Event Handlers
  bindEvents() {
    // Modal events
    document.getElementById("add-expense-btn").addEventListener("click", () => this.openAddExpenseModal())
    document.getElementById("close-modal").addEventListener("click", () => this.closeModal())
    document.getElementById("cancel-btn").addEventListener("click", () => this.closeModal())

    // Form submission
    document.getElementById("expense-form").addEventListener("submit", (e) => this.handleFormSubmit(e))

    // Filter events
    document.getElementById("search-input").addEventListener("input", () => this.renderExpenses())
    document.getElementById("category-filter").addEventListener("change", () => this.renderExpenses())
    document.getElementById("date-filter").addEventListener("change", () => this.renderExpenses())

    // Toast events
    document.getElementById("close-success").addEventListener("click", () => this.hideSuccess())
    document.getElementById("close-error").addEventListener("click", () => this.hideError())

    // Export button
    document.getElementById("export-btn").addEventListener("click", () => this.exportData())

    // Theme toggle
    document.getElementById("theme-toggle").addEventListener("click", () => this.toggleTheme())

    // Modal backdrop click
    document.getElementById("expense-modal").addEventListener("click", (e) => {
      if (e.target.id === "expense-modal") {
        this.closeModal()
      }
    })

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal()
        this.hideSuccess()
        this.hideError()
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "n") {
          e.preventDefault()
          this.openAddExpenseModal()
        }
      }
    })
  }

  handleFormSubmit(e) {
    e.preventDefault()

    const formData = {
      description: document.getElementById("expense-description").value.trim(),
      amount: document.getElementById("expense-amount").value,
      category: document.getElementById("expense-category").value,
      date: document.getElementById("expense-date").value,
    }

    // Validation
    if (!formData.description || !formData.amount || !formData.category || !formData.date) {
      this.showError("Please fill in all fields")
      return
    }

    if (Number.parseFloat(formData.amount) <= 0) {
      this.showError("Amount must be greater than 0")
      return
    }

    if (this.editingExpense) {
      this.updateExpense(this.editingExpense.id, formData)
    } else {
      this.addExpense(formData)
    }

    this.closeModal()
  }

  // Utility Functions
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0)
  }

  formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  setDefaultDate() {
    document.getElementById("expense-date").value = new Date().toISOString().split("T")[0]
  }

  // Theme Management
  initializeTheme() {
    const savedTheme = localStorage.getItem("theme") || "light"
    this.setTheme(savedTheme)
  }

  setTheme(theme) {
    document.body.setAttribute("data-theme", theme)
    localStorage.setItem("theme", theme)

    const themeToggle = document.getElementById("theme-toggle")
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙"
  }

  toggleTheme() {
    const currentTheme = document.body.getAttribute("data-theme") || "light"
    const newTheme = currentTheme === "light" ? "dark" : "light"
    this.setTheme(newTheme)
  }

  // Toast Notifications
  showSuccess(message) {
    document.getElementById("success-message").textContent = message
    document.getElementById("success-toast").classList.remove("hidden")
    setTimeout(() => this.hideSuccess(), 3000)
  }

  showError(message) {
    document.getElementById("error-message").textContent = message
    document.getElementById("error-toast").classList.remove("hidden")
    setTimeout(() => this.hideError(), 5000)
  }

  hideSuccess() {
    document.getElementById("success-toast").classList.add("hidden")
  }

  hideError() {
    document.getElementById("error-toast").classList.add("hidden")
  }

  // Export Data
  exportData() {
    const data = {
      expenses: this.expenses,
      exportDate: new Date().toISOString(),
      version: "1.0",
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `expenses_${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    this.showSuccess("Data exported successfully!")
  }
}

// Initialize the application
let expenseTracker
document.addEventListener("DOMContentLoaded", () => {
  expenseTracker = new ExpenseTracker()
})
