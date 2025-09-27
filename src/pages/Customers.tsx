import { useState } from "react";
import { Search, Filter, Download, Eye } from "lucide-react";
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
import { useNavigate } from "react-router-dom";

interface Customer {
  id: string;
  name: string;
  email: string;
  churnProbability: number;
  riskScore: "High" | "Medium" | "Low";
  segment: string;
  region: string;
  lastActivity: string;
  totalSpent: number;
}

const mockCustomers: Customer[] = [
  {
    id: "CUS001",
    name: "John Smith",
    email: "john.smith@email.com",
    churnProbability: 0.87,
    riskScore: "High",
    segment: "Premium",
    region: "North America",
    lastActivity: "2024-01-15",
    totalSpent: 1240,
  },
  {
    id: "CUS002",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    churnProbability: 0.72,
    riskScore: "High",
    segment: "Standard",
    region: "Europe",
    lastActivity: "2024-01-10",
    totalSpent: 890,
  },
  {
    id: "CUS003",
    name: "Mike Chen",
    email: "mike.chen@email.com",
    churnProbability: 0.45,
    riskScore: "Medium",
    segment: "Premium",
    region: "Asia",
    lastActivity: "2024-01-20",
    totalSpent: 2150,
  },
  {
    id: "CUS004",
    name: "Emily Davis",
    email: "emily.davis@email.com",
    churnProbability: 0.23,
    riskScore: "Low",
    segment: "Premium",
    region: "North America",
    lastActivity: "2024-01-25",
    totalSpent: 3200,
  },
  {
    id: "CUS005",
    name: "David Wilson",
    email: "david.w@email.com",
    churnProbability: 0.68,
    riskScore: "High",
    segment: "Basic",
    region: "Europe",
    lastActivity: "2024-01-05",
    totalSpent: 567,
  },
];

export default function Customers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk =
      riskFilter === "all" || customer.riskScore === riskFilter;

    const matchesRegion =
      regionFilter === "all" || customer.region === regionFilter;

    return matchesSearch && matchesRisk && matchesRegion;
  });

  const getRiskBadgeStyles = (risk: string) => {
    switch (risk) {
      case "High":
        return "bg-danger/10 text-danger border-danger/20";
      case "Medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "Low":
        return "bg-success/10 text-success border-success/20";
      default:
        return "";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">
            Manage and analyze your customer base with churn predictions
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="High">High Risk</SelectItem>
              <SelectItem value="Medium">Medium Risk</SelectItem>
              <SelectItem value="Low">Low Risk</SelectItem>
            </SelectContent>
          </Select>

          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="North America">North America</SelectItem>
              <SelectItem value="Europe">Europe</SelectItem>
              <SelectItem value="Asia">Asia</SelectItem>
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
          Showing {filteredCustomers.length} of {mockCustomers.length} customers
        </div>

        {/* Customers Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="font-semibold">Churn Risk</TableHead>
                <TableHead className="font-semibold">Segment</TableHead>
                <TableHead className="font-semibold">Region</TableHead>
                <TableHead className="font-semibold">Last Activity</TableHead>
                <TableHead className="font-semibold">Total Spent</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/customer/${customer.id}`)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">
                        {customer.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {customer.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {customer.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Badge className={getRiskBadgeStyles(customer.riskScore)}>
                        {customer.riskScore}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              customer.churnProbability > 0.7
                                ? "bg-danger"
                                : customer.churnProbability > 0.4
                                ? "bg-warning"
                                : "bg-success"
                            }`}
                            style={{
                              width: `${customer.churnProbability * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {(customer.churnProbability * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{customer.segment}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{customer.region}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{customer.lastActivity}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      ${customer.totalSpent.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/customer/${customer.id}`);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
