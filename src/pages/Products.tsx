import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Package,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Product {
  id: string;
  name: string;
  category: string;
  currentSales: number;
  forecastedSales: number;
  churnImpact: number;
  trend: "up" | "down" | "stable";
  stockLevel: number;
  price: number;
  margin: number;
}

const mockProducts: Product[] = [
  {
    id: "PRD001",
    name: "Premium Analytics Suite",
    category: "Software",
    currentSales: 145000,
    forecastedSales: 165000,
    churnImpact: 0.15,
    trend: "up",
    stockLevel: 100,
    price: 299,
    margin: 0.75,
  },
  {
    id: "PRD002",
    name: "Basic Dashboard",
    category: "Software",
    currentSales: 89000,
    forecastedSales: 82000,
    churnImpact: 0.05,
    trend: "down",
    stockLevel: 100,
    price: 99,
    margin: 0.6,
  },
  {
    id: "PRD003",
    name: "Enterprise Package",
    category: "Software",
    currentSales: 234000,
    forecastedSales: 280000,
    churnImpact: 0.25,
    trend: "up",
    stockLevel: 100,
    price: 999,
    margin: 0.8,
  },
  {
    id: "PRD004",
    name: "Mobile App License",
    category: "Mobile",
    currentSales: 67000,
    forecastedSales: 71000,
    churnImpact: 0.08,
    trend: "up",
    stockLevel: 100,
    price: 49,
    margin: 0.7,
  },
  {
    id: "PRD005",
    name: "API Access",
    category: "Developer Tools",
    currentSales: 45000,
    forecastedSales: 38000,
    churnImpact: 0.12,
    trend: "down",
    stockLevel: 100,
    price: 199,
    margin: 0.85,
  },
];

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [trendFilter, setTrendFilter] = useState("all");
  const [sortBy, setSortBy] = useState("currentSales");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, trendFilter]);

  const filteredProducts = mockProducts
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;
      const matchesTrend =
        trendFilter === "all" || product.trend === trendFilter;

      return matchesSearch && matchesCategory && matchesTrend;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof Product];
      const bValue = b[sortBy as keyof Product];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      return sortOrder === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-danger" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-muted" />;
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case "up":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            Growing
          </Badge>
        );
      case "down":
        return (
          <Badge className="bg-danger/10 text-danger border-danger/20">
            Declining
          </Badge>
        );
      default:
        return <Badge variant="outline">Stable</Badge>;
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const totalCurrentSales = mockProducts.reduce(
    (sum, product) => sum + product.currentSales,
    0
  );
  const totalForecastedSales = mockProducts.reduce(
    (sum, product) => sum + product.forecastedSales,
    0
  );
  const avgChurnImpact =
    mockProducts.reduce((sum, product) => sum + product.churnImpact, 0) /
    mockProducts.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">
            Analyze product performance and sales forecasting
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">
                  {mockProducts.length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalCurrentSales / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-muted-foreground">this quarter</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Forecasted Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalForecastedSales / 1000).toFixed(0)}K
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-xs text-success">
                  +
                  {(
                    ((totalForecastedSales - totalCurrentSales) /
                      totalCurrentSales) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Churn Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(avgChurnImpact * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                on customer retention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Software">Software</SelectItem>
              <SelectItem value="Mobile">Mobile</SelectItem>
              <SelectItem value="Developer Tools">Developer Tools</SelectItem>
            </SelectContent>
          </Select>

          <Select value={trendFilter} onValueChange={setTrendFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trend" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trends</SelectItem>
              <SelectItem value="up">Growing</SelectItem>
              <SelectItem value="down">Declining</SelectItem>
              <SelectItem value="stable">Stable</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * pageSize + 1}–
          {Math.min(currentPage * pageSize, filteredProducts.length)} of{" "}
          {filteredProducts.length} products
        </div>

        {/* Products Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 sticky top-0 z-10">
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead
                  className="font-semibold cursor-pointer hover:bg-muted/30"
                  onClick={() => handleSort("currentSales")}
                >
                  Current Sales{" "}
                  {sortBy === "currentSales" &&
                    (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="font-semibold cursor-pointer hover:bg-muted/30"
                  onClick={() => handleSort("forecastedSales")}
                >
                  Forecasted Sales{" "}
                  {sortBy === "forecastedSales" &&
                    (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="font-semibold">Trend</TableHead>
                <TableHead
                  className="font-semibold cursor-pointer hover:bg-muted/30"
                  onClick={() => handleSort("churnImpact")}
                >
                  Churn Impact{" "}
                  {sortBy === "churnImpact" &&
                    (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="font-semibold cursor-pointer hover:bg-muted/30"
                  onClick={() => handleSort("price")}
                >
                  Price{" "}
                  {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="font-semibold cursor-pointer hover:bg-muted/30"
                  onClick={() => handleSort("margin")}
                >
                  Margin{" "}
                  {sortBy === "margin" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => (
                <TableRow
                  key={product.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">
                        {product.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {product.category}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {product.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      ${product.currentSales.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className="font-medium">
                        ${product.forecastedSales.toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-1">
                        {product.forecastedSales > product.currentSales ? (
                          <TrendingUp className="w-3 h-3 text-success" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-danger" />
                        )}
                        <span
                          className={`text-xs ${
                            product.forecastedSales > product.currentSales
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {product.forecastedSales > product.currentSales
                            ? "+"
                            : ""}
                          {(
                            ((product.forecastedSales - product.currentSales) /
                              product.currentSales) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(product.trend)}
                      {getTrendBadge(product.trend)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span
                        className={`font-medium ${
                          product.churnImpact > 0.2
                            ? "text-danger"
                            : product.churnImpact > 0.1
                            ? "text-warning"
                            : "text-success"
                        }`}
                      >
                        {(product.churnImpact * 100).toFixed(1)}%
                      </span>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            product.churnImpact > 0.2
                              ? "bg-danger"
                              : product.churnImpact > 0.1
                              ? "bg-warning"
                              : "bg-success"
                          }`}
                          style={{
                            width: `${Math.min(
                              product.churnImpact * 500,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">${product.price}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {(product.margin * 100).toFixed(0)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Rows per page:
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className={
                        currentPage === page
                          ? "bg-primary text-primary-foreground"
                          : "cursor-pointer"
                      }
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </DashboardLayout>
  );
}
