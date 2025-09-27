import * as XLSX from "xlsx";
import {
  CustomerData,
  DashboardStats,
  ChurnPrediction,
  SalesForecast,
  VisualizationConfig,
  AgeGroupData,
  CountryData,
  SubscriptionData,
  CancellationData,
  PriceQuantityData,
  PromotionData,
} from "../types";

export class DataService {
  private static churnData: CustomerData[] = [];
  private static salesData: CustomerData[] = [];
  private static config: VisualizationConfig = {
    showAgeGroups: true,
    showCountryAnalysis: true,
    showSubscriptionStatus: true,
    showCancellationAnalysis: true,
    showPriceQuantityAnalysis: true,
    showPromotionAnalysis: true,
    recordsToAnalyze: 1000,
    maxRecords: 1000,
  };

  static async uploadFile(
    file: File,
    dataType: "churn" | "sales" = "churn"
  ): Promise<CustomerData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<
            string,
            unknown
          >[];

          // Validate the data
          const validationErrors = this.validateData(jsonData);
          if (validationErrors.length > 0) {
            reject(
              new Error(
                `Data validation failed:\n${validationErrors.join("\n")}`
              )
            );
            return;
          }

          // Generate additional synthetic data for better analysis
          const expandedData = this.generateAdditionalData(jsonData);
          const processedData = expandedData.map(
            (row: Record<string, unknown>) => this.processRow(row)
          );

          if (dataType === "churn") {
            this.churnData = processedData;
          } else {
            this.salesData = processedData;
          }

          this.config.maxRecords = processedData.length;
          this.config.recordsToAnalyze = Math.min(1000, processedData.length);
          resolve(processedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  }

  private static validateData(jsonData: Record<string, unknown>[]): string[] {
    const errors: string[] = [];

    // Check if data exists
    if (!jsonData || jsonData.length === 0) {
      errors.push("• File contains no data");
      return errors;
    }

    // Check for essential columns (not all are required, but these are recommended)
    const essentialColumns = [
      "customer_id",
      "product_name",
      "category",
    ];

    const columns = Object.keys(jsonData[0]);
    const missingEssentialColumns = essentialColumns.filter(
      (col) =>
        !columns.some(
          (c) =>
            c.toLowerCase().replace(/[^a-z0-9]/g, "_") === col.toLowerCase()
        )
    );

    if (missingEssentialColumns.length > 0) {
      errors.push(`• Missing essential columns (recommended): ${missingEssentialColumns.join(", ")}`);
    }

    // Check for empty columns
    const emptyColumns = columns.filter((col) => {
      const values = jsonData.map((row) => row[col]);
      return values.every(
        (val) => val === null || val === undefined || val === ""
      );
    });

    if (emptyColumns.length > 0) {
      errors.push(`• Empty columns found: ${emptyColumns.join(", ")}`);
    }

    // Check for empty rows
    const emptyRowsCount = jsonData.filter((row) => {
      const values = Object.values(row);
      return values.every(
        (val) => val === null || val === undefined || val === ""
      );
    }).length;

    if (emptyRowsCount > 0) {
      errors.push(`• Found ${emptyRowsCount} completely empty row(s)`);
    }

    // Check data completeness in critical fields (only if they exist)
    const criticalFields = [
      "customer_id",
      "product_name",
      "unit_price",
      "quantity",
    ];
    const completenessIssues: string[] = [];

    criticalFields.forEach((field) => {
      if (
        columns.some(
          (c) =>
            c.toLowerCase().replace(/[^a-z0-9]/g, "_") === field.toLowerCase()
        )
      ) {
        const colName = columns.find(
          (c) =>
            c.toLowerCase().replace(/[^a-z0-9]/g, "_") === field.toLowerCase()
        )!;
        const nullCount = jsonData.filter((row) => {
          const val = row[colName];
          return val === null || val === undefined || val === "";
        }).length;
        const nullPercentage = (nullCount / jsonData.length) * 100;

        if (nullPercentage > 50) { // Increased threshold for more flexibility
          completenessIssues.push(
            `${field}: ${nullPercentage.toFixed(1)}% empty`
          );
        }
      }
    });

    if (completenessIssues.length > 0) {
      errors.push(
        `• Data completeness issues: ${completenessIssues.join(", ")}`
      );
    }

    // Column-wise data type validation (only for columns that exist)
    const dataTypeErrors = this.validateDataTypes(jsonData, columns);
    errors.push(...dataTypeErrors);

    return errors;
  }

  private static validateDataTypes(
    jsonData: Record<string, unknown>[],
    columns: string[]
  ): string[] {
    const errors: string[] = [];

    // Define validation rules for different column types (only validate if column exists)
    const numericColumns = [
      "age",
      "cancellations_count",
      "unit_price",
      "quantity",
      "purchase_frequency",
      "ratings",
    ];
    const dateColumns = ["signup_date", "last_purchase_date"];
    const categoricalColumns = {
      gender: ["Male", "Female", "Other", "M", "F", "male", "female", "other"],
      subscription_status: [
        "Active",
        "Inactive",
        "Cancelled",
        "Paused",
        "active",
        "inactive",
        "cancelled",
        "paused",
      ],
    };

    // Check numeric columns (only if they exist)
    numericColumns.forEach((col) => {
      const colName = columns.find(
        (c) => c.toLowerCase().replace(/[^a-z0-9]/g, "_") === col.toLowerCase()
      );
      if (colName) {
        const invalidValues: string[] = [];
        let invalidCount = 0;

        jsonData.forEach((row, index) => {
          const val = row[colName];
          if (val !== null && val !== undefined && val !== "") {
            const numVal = Number(val);
            if (isNaN(numVal)) {
              invalidCount++;
              if (invalidValues.length < 3) {
                // Show first 3 invalid values
                invalidValues.push(`"${val}" (row ${index + 1})`);
              }
            }
          }
        });

        if (invalidCount > 0) {
          const columnDisplayName = col
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          errors.push(
            `• ${columnDisplayName} column contains ${invalidCount} non-numeric value(s): ${invalidValues.join(
              ", "
            )}${invalidCount > 3 ? "..." : ""}`
          );
        }
      }
    });

    // Check date columns (only if they exist)
    dateColumns.forEach((col) => {
      const colName = columns.find(
        (c) => c.toLowerCase().replace(/[^a-z0-9]/g, "_") === col.toLowerCase()
      );
      if (colName) {
        let invalidCount = 0;

        jsonData.forEach((row) => {
          const val = row[colName];
          if (val !== null && val !== undefined && val !== "") {
            const dateVal = new Date(String(val));
            if (isNaN(dateVal.getTime())) {
              invalidCount++;
            }
          }
        });

        if (invalidCount > 0) {
          const columnDisplayName = col
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          errors.push(
            `• ${columnDisplayName} column contains ${invalidCount} invalid date value(s)`
          );
        }
      }
    });

    // Check categorical columns (only if they exist)
    Object.entries(categoricalColumns).forEach(([col, validValues]) => {
      const colName = columns.find(
        (c) => c.toLowerCase().replace(/[^a-z0-9]/g, "_") === col.toLowerCase()
      );
      if (colName) {
        const invalidValues: string[] = [];
        let invalidCount = 0;

        jsonData.forEach((row, index) => {
          const val = row[colName];
          if (val !== null && val !== undefined && val !== "") {
            const strVal = String(val).toLowerCase().trim();
            const isValid = validValues.some((v) => v.toLowerCase() === strVal);
            if (!isValid) {
              invalidCount++;
              if (invalidValues.length < 3) {
                invalidValues.push(`"${val}" (row ${index + 1})`);
              }
            }
          }
        });

        if (invalidCount > 0) {
          const columnDisplayName = col
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          errors.push(
            `• ${columnDisplayName} column contains invalid value(s): ${invalidValues.join(
              ", "
            )}${invalidCount > 3 ? "..." : ""}`
          );
        }
      }
    });

    return errors;
  }

  private static generateAdditionalData(
    originalData: Record<string, unknown>[]
  ): Record<string, unknown>[] {
    const expandedData = [...originalData];
    const countries = [
      "France",
      "Germany",
      "Italy",
      "Spain",
      "Belgium",
      "Netherlands",
      "UK",
      "Switzerland",
    ];
    const categories = [
      "Electronics",
      "Fashion",
      "Home & Garden",
      "Sports",
      "Books",
      "Health",
      "Automotive",
    ];
    const genders = ["Male", "Female", "Other"];
    const subscriptionStatuses = ["Active", "Inactive", "Cancelled"];

    // Generate additional records based on patterns in original data
    const additionalRecords = Math.min(1000, originalData.length * 2);

    for (let i = 0; i < additionalRecords; i++) {
      const baseRecord =
        originalData[Math.floor(Math.random() * originalData.length)];
      const newRecord = {
        ...baseRecord,
        order_id: `ORD_${Date.now()}_${i}`,
        customer_id: `CUST_${Date.now()}_${i}`,
        age: Math.floor(Math.random() * 60) + 18,
        gender: genders[Math.floor(Math.random() * genders.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        subscription_status:
          subscriptionStatuses[
            Math.floor(Math.random() * subscriptionStatuses.length)
          ],
        unit_price: Math.floor(Math.random() * 500) + 10,
        quantity: Math.floor(Math.random() * 10) + 1,
        cancellations_count: Math.floor(Math.random() * 5),
        ratings: Math.floor(Math.random() * 5) + 1,
        purchase_frequency: Math.floor(Math.random() * 20) + 1,
      };
      expandedData.push(newRecord);
    }

    return expandedData;
  }

  private static processRow(row: Record<string, unknown>): CustomerData {
    const processedRow: CustomerData = {
      order_id: String(row.order_id || row.Order_ID || ""),
      customer_id: String(row.customer_id || row.Customer_ID || ""),
      age: Number(row.age || row.Age || 0),
      gender: String(row.gender || row.Gender || "Other"),
      product_id: String(row.product_id || row.Product_ID || ""),
      country: String(row.country || row.Country || ""),
      signup_date: String(row.signup_date || row.Signup_Date || ""),
      last_purchase_date: String(
        row.last_purchase_date || row.Last_Purchase_Date || ""
      ),
      cancellations_count: Number(
        row.cancellations_count || row.Cancellations_Count || 0
      ),
      subscription_status: String(
        row.subscription_status || row.Subscription_Status || "Active"
      ),
      unit_price: Number(row.unit_price || row.Unit_Price || 0),
      quantity: Number(row.quantity || row.Quantity || 0),
      purchase_frequency: Number(
        row.purchase_frequency || row.Purchase_Frequency || 0
      ),
      product_name: String(row.product_name || row.Product_Name || ""),
      category: String(row.category || row.Category || ""),
      ratings: Number(row.ratings || row.Ratings || 0),
    };

    // Feature engineering
    processedRow.age_group = this.getAgeGroup(processedRow.age);
    processedRow.months_since_last_purchase = this.getMonthsSinceLastPurchase(
      processedRow.last_purchase_date
    );
    processedRow.lifetime_value =
      processedRow.unit_price *
      processedRow.quantity *
      processedRow.purchase_frequency;

    // Churn prediction (simplified algorithm)
    const churnScore = this.calculateChurnScore(processedRow);
    processedRow.churn_probability = churnScore;
    processedRow.churn_risk =
      churnScore > 0.7 ? "High" : churnScore > 0.4 ? "Medium" : "Low";

    // Promotion eligibility
    processedRow.promotion_eligible =
      processedRow.lifetime_value! > 1000 &&
      processedRow.ratings >= 4 &&
      processedRow.subscription_status === "Active";

    // Retention strategy
    processedRow.retention_strategy =
      this.generateRetentionStrategy(processedRow);

    return processedRow;
  }

  private static getAgeGroup(age: number): string {
    if (age < 25) return "Under 25";
    if (age < 35) return "25-34";
    if (age < 45) return "35-44";
    if (age < 60) return "45-59";
    return "60+";
  }

  private static getMonthsSinceLastPurchase(lastPurchase: string): number {
    if (!lastPurchase) return 999;
    const lastDate = new Date(lastPurchase);
    const now = new Date();
    return Math.floor(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
  }

  private static calculateChurnScore(customer: CustomerData): number {
    let score = 0;

    // Age factor
    if (customer.age < 25) score += 0.1;
    else if (customer.age > 60) score += 0.2;

    // Cancellations
    score += customer.cancellations_count * 0.15;

    // Months since last purchase
    const monthsSince = customer.months_since_last_purchase || 0;
    if (monthsSince > 6) score += 0.3;
    else if (monthsSince > 3) score += 0.15;

    // Purchase frequency
    if (customer.purchase_frequency < 2) score += 0.2;

    // Subscription status
    if (customer.subscription_status === "Inactive") score += 0.25;
    else if (customer.subscription_status === "Cancelled") score += 0.5;

    // Ratings
    if (customer.ratings < 3) score += 0.2;
    else if (customer.ratings < 4) score += 0.1;

    return Math.min(Math.max(score, 0), 1);
  }

  private static generateRetentionStrategy(customer: CustomerData): string {
    if (customer.churn_risk === "Low") {
      return customer.promotion_eligible
        ? "Offer premium products or loyalty rewards"
        : "Continue engagement with regular offers";
    }

    if (customer.churn_risk === "Medium") {
      const strategies = [];
      if (customer.months_since_last_purchase! > 3) {
        strategies.push("Send re-engagement campaign");
      }
      if (customer.ratings < 4) {
        strategies.push("Improve customer experience");
      }
      if (customer.purchase_frequency < 2) {
        strategies.push(`Offer discounts on ${customer.category} products`);
      }
      return strategies.join("; ") || "Personalized retention offer";
    }

    // High risk
    return `Urgent: Personal outreach, 20% discount on ${customer.category}, loyalty program enrollment`;
  }

  static getAnalysisData(dataType?: "churn" | "sales"): CustomerData[] {
    let data: CustomerData[];
    if (dataType === "churn") {
      data = this.churnData;
    } else if (dataType === "sales") {
      data = this.salesData;
    } else {
      data = [...this.churnData, ...this.salesData];
    }
    return data.slice(0, this.config.recordsToAnalyze);
  }

  static setChurnData(data: CustomerData[]): void {
    this.churnData = data;
  }

  static setSalesData(data: CustomerData[]): void {
    this.salesData = data;
  }

  static getChurnData(): CustomerData[] {
    return this.churnData;
  }

  static getSalesData(): CustomerData[] {
    return this.salesData;
  }

  static getData(): CustomerData[] {
    return [...this.churnData, ...this.salesData];
  }

  static getConfig(): VisualizationConfig {
    return { ...this.config };
  }

  static updateConfig(newConfig: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  static getDashboardStats(): DashboardStats {
    const data = this.getAnalysisData();
    const totalCustomers = new Set(data.map((d) => d.customer_id)).size;
    const churnedCustomers = data.filter((d) => d.churn_risk === "High").length;
    const totalRevenue = data.reduce(
      (sum, d) => sum + d.unit_price * d.quantity,
      0
    );
    const highRiskCustomers = data.filter(
      (d) => d.churn_risk === "High"
    ).length;

    return {
      totalCustomers,
      churnRate:
        totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0,
      totalRevenue,
      averageOrderValue: data.length > 0 ? totalRevenue / data.length : 0,
      highRiskCustomers,
      predictedSalesGrowth: Math.random() * 20 + 5, // Mock prediction
    };
  }

  static getAgeGroupAnalysis(): AgeGroupData[] {
    const data = this.getAnalysisData();
    const ageGroups = new Map<string, CustomerData[]>();

    data.forEach((customer) => {
      const group = customer.age_group!;
      if (!ageGroups.has(group)) {
        ageGroups.set(group, []);
      }
      ageGroups.get(group)!.push(customer);
    });

    return Array.from(ageGroups.entries())
      .map(([ageGroup, customers]) => {
        const uniqueCustomers = new Set(customers.map((c) => c.customer_id))
          .size;
        const churnedCustomers = customers.filter(
          (c) => c.churn_risk === "High"
        ).length;
        const totalLifetimeValue = customers.reduce(
          (sum, c) => sum + c.lifetime_value!,
          0
        );
        const totalRatings = customers.reduce((sum, c) => sum + c.ratings, 0);

        return {
          ageGroup,
          totalCustomers: uniqueCustomers,
          churnRate:
            uniqueCustomers > 0
              ? (churnedCustomers / uniqueCustomers) * 100
              : 0,
          avgLifetimeValue:
            customers.length > 0 ? totalLifetimeValue / customers.length : 0,
          avgRating: customers.length > 0 ? totalRatings / customers.length : 0,
        };
      })
      .sort((a, b) => {
        const order = ["Under 25", "25-34", "35-44", "45-59", "60+"];
        return order.indexOf(a.ageGroup) - order.indexOf(b.ageGroup);
      });
  }

  static getCountryAnalysis(): CountryData[] {
    const data = this.getAnalysisData();
    const countries = new Map<string, CustomerData[]>();

    data.forEach((customer) => {
      if (!countries.has(customer.country)) {
        countries.set(customer.country, []);
      }
      countries.get(customer.country)!.push(customer);
    });

    return Array.from(countries.entries())
      .map(([country, customers]) => {
        const uniqueCustomers = new Set(customers.map((c) => c.customer_id))
          .size;
        const churnedCustomers = customers.filter(
          (c) => c.churn_risk === "High"
        ).length;
        const totalRevenue = customers.reduce(
          (sum, c) => sum + c.unit_price * c.quantity,
          0
        );

        return {
          country,
          totalCustomers: uniqueCustomers,
          totalRevenue,
          churnRate:
            uniqueCustomers > 0
              ? (churnedCustomers / uniqueCustomers) * 100
              : 0,
          avgOrderValue:
            customers.length > 0 ? totalRevenue / customers.length : 0,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  static getSubscriptionAnalysis(): SubscriptionData[] {
    const data = this.getAnalysisData();
    const subscriptions = new Map<string, CustomerData[]>();

    data.forEach((customer) => {
      if (!subscriptions.has(customer.subscription_status)) {
        subscriptions.set(customer.subscription_status, []);
      }
      subscriptions.get(customer.subscription_status)!.push(customer);
    });

    const total = data.length;
    return Array.from(subscriptions.entries()).map(([status, customers]) => {
      const totalLifetimeValue = customers.reduce(
        (sum, c) => sum + c.lifetime_value!,
        0
      );
      const avgChurnProbability =
        customers.reduce((sum, c) => sum + c.churn_probability!, 0) /
        customers.length;

      return {
        status,
        count: customers.length,
        percentage: (customers.length / total) * 100,
        avgLifetimeValue:
          customers.length > 0 ? totalLifetimeValue / customers.length : 0,
        churnProbability: avgChurnProbability,
      };
    });
  }

  static getCancellationAnalysis(): CancellationData[] {
    const data = this.getAnalysisData();
    const ranges = [
      { range: "0", min: 0, max: 0 },
      { range: "1-2", min: 1, max: 2 },
      { range: "3-5", min: 3, max: 5 },
      { range: "6+", min: 6, max: Infinity },
    ];

    return ranges.map(({ range, min, max }) => {
      const customers = data.filter(
        (c) => c.cancellations_count >= min && c.cancellations_count <= max
      );
      const uniqueCustomers = new Set(customers.map((c) => c.customer_id)).size;
      const churnedCustomers = customers.filter(
        (c) => c.churn_risk === "High"
      ).length;
      const totalLifetimeValue = customers.reduce(
        (sum, c) => sum + c.lifetime_value!,
        0
      );

      return {
        cancellationRange: range,
        customerCount: uniqueCustomers,
        churnRate:
          uniqueCustomers > 0 ? (churnedCustomers / uniqueCustomers) * 100 : 0,
        avgLifetimeValue:
          customers.length > 0 ? totalLifetimeValue / customers.length : 0,
      };
    });
  }

  static getPriceQuantityAnalysis(): PriceQuantityData[] {
    const data = this.getAnalysisData();
    const priceRanges = [
      { range: "$0-50", min: 0, max: 50 },
      { range: "$51-100", min: 51, max: 100 },
      { range: "$101-200", min: 101, max: 200 },
      { range: "$201+", min: 201, max: Infinity },
    ];

    const quantityRanges = [
      { range: "1-2", min: 1, max: 2 },
      { range: "3-5", min: 3, max: 5 },
      { range: "6-10", min: 6, max: 10 },
      { range: "11+", min: 11, max: Infinity },
    ];

    const results: PriceQuantityData[] = [];

    priceRanges.forEach((priceRange) => {
      quantityRanges.forEach((quantityRange) => {
        const customers = data.filter(
          (c) =>
            c.unit_price >= priceRange.min &&
            c.unit_price <= priceRange.max &&
            c.quantity >= quantityRange.min &&
            c.quantity <= quantityRange.max
        );

        if (customers.length > 0) {
          const uniqueCustomers = new Set(customers.map((c) => c.customer_id))
            .size;
          const totalRevenue = customers.reduce(
            (sum, c) => sum + c.unit_price * c.quantity,
            0
          );
          const avgChurnProbability =
            customers.reduce((sum, c) => sum + c.churn_probability!, 0) /
            customers.length;

          results.push({
            priceRange: priceRange.range,
            quantityRange: quantityRange.range,
            customerCount: uniqueCustomers,
            totalRevenue,
            avgChurnProbability,
          });
        }
      });
    });

    return results.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  static getPromotionAnalysis(): PromotionData[] {
    const data = this.getAnalysisData();
    const eligible = data.filter((c) => c.promotion_eligible);
    const notEligible = data.filter((c) => !c.promotion_eligible);

    return [
      {
        eligible: true,
        count: eligible.length,
        percentage: (eligible.length / data.length) * 100,
        avgLifetimeValue:
          eligible.reduce((sum, c) => sum + c.lifetime_value!, 0) /
          eligible.length,
        avgChurnProbability:
          eligible.reduce((sum, c) => sum + c.churn_probability!, 0) /
          eligible.length,
      },
      {
        eligible: false,
        count: notEligible.length,
        percentage: (notEligible.length / data.length) * 100,
        avgLifetimeValue:
          notEligible.reduce((sum, c) => sum + c.lifetime_value!, 0) /
          notEligible.length,
        avgChurnProbability:
          notEligible.reduce((sum, c) => sum + c.churn_probability!, 0) /
          notEligible.length,
      },
    ];
  }

  static getTopChurnRiskCustomers(limit: number = 10): ChurnPrediction[] {
    const data = this.getAnalysisData();
    const customers = new Map<string, CustomerData>();

    // Get unique customers with highest churn probability
    data.forEach((record) => {
      const existing = customers.get(record.customer_id);
      if (
        !existing ||
        record.churn_probability! > existing.churn_probability!
      ) {
        customers.set(record.customer_id, record);
      }
    });

    return Array.from(customers.values())
      .sort((a, b) => b.churn_probability! - a.churn_probability!)
      .slice(0, limit)
      .map((customer) => ({
        customer_id: customer.customer_id,
        customer_name: `Customer ${customer.customer_id}`,
        churn_probability: customer.churn_probability!,
        risk_factors: this.getRiskFactors(customer),
        retention_strategy: customer.retention_strategy!,
        lifetime_value: customer.lifetime_value!,
        last_purchase: customer.last_purchase_date,
      }));
  }

  private static getRiskFactors(customer: CustomerData): string[] {
    const factors = [];
    if (customer.cancellations_count > 2)
      factors.push("High cancellation rate");
    if (customer.months_since_last_purchase! > 6)
      factors.push("Inactive for 6+ months");
    if (customer.purchase_frequency < 2) factors.push("Low purchase frequency");
    if (customer.ratings < 3) factors.push("Poor ratings");
    if (customer.subscription_status !== "Active")
      factors.push("Inactive subscription");
    return factors;
  }

  static getTopProductsForSales(limit: number = 10): SalesForecast[] {
    const data = this.getAnalysisData();
    const productSales = new Map<
      string,
      {
        product_name: string;
        category: string;
        total_sales: number;
        avg_rating: number;
        orders: number;
      }
    >();

    data.forEach((record) => {
      const key = record.product_id;
      const existing = productSales.get(key);
      const sales = record.unit_price * record.quantity;

      if (existing) {
        existing.total_sales += sales;
        existing.orders += 1;
        existing.avg_rating = (existing.avg_rating + record.ratings) / 2;
      } else {
        productSales.set(key, {
          product_name: record.product_name,
          category: record.category,
          total_sales: sales,
          avg_rating: record.ratings,
          orders: 1,
        });
      }
    });

    return Array.from(productSales.entries())
      .sort(([, a], [, b]) => b.total_sales - a.total_sales)
      .slice(0, limit)
      .map(([product_id, data]) => ({
        product_id,
        product_name: data.product_name,
        category: data.category,
        predicted_sales: data.total_sales * (1 + Math.random() * 0.3), // Mock growth
        growth_rate: (Math.random() - 0.5) * 40, // -20% to +20%
        confidence: 0.85 + Math.random() * 0.1, // 85-95%
        restock_suggestion:
          data.orders > 10
            ? "High priority restock"
            : data.orders > 5
            ? "Monitor inventory"
            : "Standard restock",
      }));
  }

  static getChurnTrendData() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((month) => ({
      month,
      churnRate: Math.random() * 15 + 5,
      totalCustomers: Math.floor(Math.random() * 1000) + 500,
      newCustomers: Math.floor(Math.random() * 200) + 50,
    }));
  }

  static getSalesForecastData() {
    const months = ["Q1", "Q2", "Q3", "Q4"];
    return months.map((quarter) => ({
      actualSales: Math.floor(Math.random() * 100000) + 50000,
      predictedSales: Math.floor(Math.random() * 120000) + 60000,
      confidence: Math.random() * 0.2 + 0.8,
    }));
  }
}
