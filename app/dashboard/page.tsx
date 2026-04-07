// app/dashboard/page.tsx
// Financial Dashboard with analytics

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Upload,
  RefreshCw,
  Trash2,
  Download,
  Filter,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency, formatMonth } from "@/lib/utils";
import Link from "next/link";

interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  transactionCount: number;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
  topExpenses: Array<{
    description: string;
    amount: number;
    date: string;
    category: string | null;
  }>;
  averageMonthlyExpenses: number;
  burnRate: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  Housing: "#ef4444",
  Utilities: "#f97316",
  Groceries: "#eab308",
  Transport: "#84cc16",
  Healthcare: "#22c55e",
  Entertainment: "#10b981",
  Dining: "#14b8a6",
  Shopping: "#06b6d4",
  Travel: "#0ea5e9",
  Education: "#3b82f6",
  Personal: "#8b5cf6",
  Business: "#d946ef",
  Other: "#64748b",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, transRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/transactions"),
      ]);

      const statsData = await statsRes.json();
      const transData = await transRes.json();

      setStats(statsData);
      // API returns { transactions: [...], pagination: {...} }
      const transArray = Array.isArray(transData) 
        ? transData 
        : (Array.isArray(transData?.transactions) ? transData.transactions : []);
      setTransactions(transArray);
    } catch (error) {
      console.error("Error fetching data:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this transaction?")) {
      try {
        const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
        if (res.ok) {
          setTransactions(transactions.filter((t) => t.id !== id));
        }
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const filteredTransactions = transactions
    .filter((t) => (filter === "all" ? true : t.category === filter))
    .filter((t) => t.description.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-slate-600 mb-4">No data available</p>
            <Link href="/upload" className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Transactions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Financial Dashboard</h1>
              <p className="text-sm text-slate-500">Local-first personal finance analytics</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Link href="/upload">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Income</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatCurrency(stats.totalIncome)}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Expenses</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatCurrency(stats.totalExpenses)}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Net Cashflow</p>
                  <p
                    className={`text-3xl font-bold ${
                      stats.netCashflow >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(stats.netCashflow)}
                  </p>
                </div>
                <div className={`p-2 ${stats.netCashflow >= 0 ? "bg-green-100" : "bg-red-100"} rounded`}>
                  <DollarSign className={`w-5 h-5 ${stats.netCashflow >= 0 ? "text-green-600" : "text-red-600"}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Transactions</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.transactionCount}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Trend</CardTitle>
              <CardDescription>Income and expenses over time</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-500 py-8">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Expense breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.categoryBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {stats.categoryBreakdown.slice(0, 5).map((cat) => (
                    <div key={cat.category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{cat.category}</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(cat.amount)}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: CATEGORY_COLORS[cat.category] || "#64748b",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No data</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>All recorded transactions</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Filter className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="pl-8 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Array.from(new Set(transactions.map((t) => t.category).filter(Boolean))).map(
                        (cat) => (
                          <SelectItem key={cat} value={cat || "Uncategorized"}>
                            {cat || "Uncategorized"}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.slice(0, 10).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(tx.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">{tx.description}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                          {tx.category || "Uncategorized"}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-sm font-semibold text-right ${
                          tx.amount >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="text-slate-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
