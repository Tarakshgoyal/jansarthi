"use client";

import { useEffect, useState } from "react";
import {
  FileWarning,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getPWDDashboard, getIssues, Issue, PWDDashboardStats } from "@/lib/api";

const issueTypeLabels: Record<string, { en: string; hi: string; color: string }> = {
  water: { en: "Water Issue", hi: "जल समस्या", color: "bg-blue-500" },
  electricity: { en: "Electricity Issue", hi: "बिजली समस्या", color: "bg-yellow-500" },
  road: { en: "Road Issue", hi: "सड़क समस्या", color: "bg-gray-500" },
  garbage: { en: "Garbage Issue", hi: "कचरा समस्या", color: "bg-green-500" },
  sewerage: { en: "Sewerage Issue", hi: "सीवेज समस्या", color: "bg-purple-500" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  reported: { label: "Reported", color: "bg-red-100 text-red-800" },
  assigned: { label: "Assigned", color: "bg-blue-100 text-blue-800" },
  parshad_check: { label: "Parshad Check", color: "bg-yellow-100 text-yellow-800" },
  started_working: { label: "In Progress", color: "bg-orange-100 text-orange-800" },
  finished_work: { label: "Completed", color: "bg-green-100 text-green-800" },
};

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentIssueRow({ issue }: { issue: Issue }) {
  const issueType = issueTypeLabels[issue.issue_type] || { en: issue.issue_type, hi: issue.issue_type, color: "bg-gray-500" };
  const status = statusLabels[issue.status] || { label: issue.status, color: "bg-gray-100 text-gray-800" };

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${issueType.color}`} />
        <div>
          <p className="font-medium text-sm">{issueType.hi}</p>
          <p className="text-xs text-muted-foreground">
            Ward {issue.ward_number} • {new Date(issue.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <Badge variant="secondary" className={status.color}>
        {status.label}
      </Badge>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<PWDDashboardStats | null>(null);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [dashboardData, issuesData] = await Promise.all([
          getPWDDashboard(),
          getIssues({ limit: 5 }),
        ]);
        setStats(dashboardData);
        setRecentIssues(issuesData?.issues || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Error Loading Dashboard</h3>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of all issues and activities in Dehradun Nagar Nigam
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Issues"
          value={stats?.total_issues || 0}
          icon={FileWarning}
          description="All reported issues"
        />
        <StatCard
          title="Pending"
          value={stats?.pending_issues || 0}
          icon={Clock}
          description="Awaiting assignment"
          className="border-l-4 border-l-yellow-500"
        />
        <StatCard
          title="In Progress"
          value={stats?.in_progress_issues || 0}
          icon={AlertTriangle}
          description="Currently being addressed"
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          title="Completed"
          value={stats?.completed_issues || 0}
          icon={CheckCircle2}
          description="Successfully resolved"
          className="border-l-4 border-l-green-500"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Active Parshads"
          value={stats?.total_parshads || 0}
          icon={Users}
          description="Ward representatives"
        />
        <StatCard
          title="Total Users"
          value={stats?.total_users || 0}
          icon={Users}
          description="Registered citizens"
        />
        <StatCard
          title="Resolution Rate"
          value={
            stats?.total_issues
              ? `${Math.round(((stats.completed_issues || 0) / stats.total_issues) * 100)}%`
              : "0%"
          }
          icon={TrendingUp}
          description="Issues resolved"
        />
      </div>

      {/* Recent Issues & Issue Types */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Issues</CardTitle>
            <CardDescription>
              Latest reported issues across all wards
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentIssues && recentIssues.length > 0 ? (
              <div>
                {recentIssues.map((issue) => (
                  <RecentIssueRow key={issue.id} issue={issue} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No issues reported yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issues by Type</CardTitle>
            <CardDescription>
              Distribution of issues by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.issues_by_type ? (
                Object.entries(stats.issues_by_type).map(([type, count]) => {
                  const issueType = issueTypeLabels[type] || { en: type, hi: type, color: "bg-gray-500" };
                  const total = stats.total_issues || 1;
                  const percentage = Math.round((count / total) * 100);
                  
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${issueType.color}`} />
                          <span className="text-sm font-medium">{issueType.hi}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${issueType.color} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
