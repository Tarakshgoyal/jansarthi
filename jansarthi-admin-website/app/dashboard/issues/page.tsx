"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserPlus,
  MapPin,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getIssues, getParshads, assignParshad, Issue, ParshadInfo, IssuesResponse } from "@/lib/api";

const issueTypeLabels: Record<string, { en: string; hi: string; color: string }> = {
  water: { en: "Water Issue", hi: "जल समस्या", color: "bg-blue-500" },
  electricity: { en: "Electricity Issue", hi: "बिजली समस्या", color: "bg-yellow-500" },
  road: { en: "Road Issue", hi: "सड़क समस्या", color: "bg-gray-600" },
  garbage: { en: "Garbage Issue", hi: "कचरा समस्या", color: "bg-green-500" },
  sewerage: { en: "Sewerage Issue", hi: "सीवेज समस्या", color: "bg-purple-500" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  reported: { label: "Reported", color: "bg-red-100 text-red-800 border-red-200" },
  assigned: { label: "Assigned", color: "bg-blue-100 text-blue-800 border-blue-200" },
  parshad_check: { label: "Parshad Check", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  started_working: { label: "In Progress", color: "bg-orange-100 text-orange-800 border-orange-200" },
  finished_work: { label: "Completed", color: "bg-green-100 text-green-800 border-green-200" },
};

const ITEMS_PER_PAGE = 10;

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>("all");
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Assignment Dialog
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [parshads, setParshads] = useState<ParshadInfo[]>([]);
  const [selectedParshadId, setSelectedParshadId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Detail Dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailIssue, setDetailIssue] = useState<Issue | null>(null);

  const fetchIssues = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: Parameters<typeof getIssues>[0] = {
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
      };

      if (statusFilter !== "all") params.status = statusFilter;
      if (issueTypeFilter !== "all") params.issue_type = issueTypeFilter;
      if (wardFilter !== "all") params.ward_number = parseInt(wardFilter);

      const data = await getIssues(params);
      // Handle both array and object responses
      const issuesList = Array.isArray(data) 
        ? data 
        : ((data as unknown as { issues?: Issue[]; items?: Issue[] })?.issues || 
           (data as unknown as { issues?: Issue[]; items?: Issue[] })?.items || 
           []);
      setIssues(issuesList);
      setTotalCount((data as unknown as { total?: number })?.total || issuesList.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load issues");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, issueTypeFilter, wardFilter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const fetchParshads = async () => {
    try {
      const data = await getParshads();
      const parshadList = Array.isArray(data) 
        ? data 
        : ((data as unknown as { items?: ParshadInfo[]; parshads?: ParshadInfo[] })?.items || 
           (data as unknown as { items?: ParshadInfo[]; parshads?: ParshadInfo[] })?.parshads || 
           []);
      setParshads(parshadList);
    } catch (err) {
      console.error("Failed to fetch parshads:", err);
    }
  };

  const handleAssignClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setSelectedParshadId("");
    setShowAssignDialog(true);
    fetchParshads();
  };

  const handleAssign = async () => {
    if (!selectedIssue || !selectedParshadId) return;

    try {
      setIsAssigning(true);
      await assignParshad(selectedIssue.id, parseInt(selectedParshadId));
      setShowAssignDialog(false);
      fetchIssues();
    } catch (err) {
      console.error("Failed to assign parshad:", err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleViewDetail = (issue: Issue) => {
    setDetailIssue(issue);
    setShowDetailDialog(true);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const filteredIssues = (issues || []).filter((issue) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      issue.description?.toLowerCase().includes(query) ||
      issue.address?.toLowerCase().includes(query) ||
      issue.ward_number?.toString().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Issues Management</h1>
          <p className="text-muted-foreground">
            View and manage all reported issues
          </p>
        </div>
        <Button onClick={fetchIssues} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="parshad_check">Parshad Check</SelectItem>
                <SelectItem value="started_working">In Progress</SelectItem>
                <SelectItem value="finished_work">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={issueTypeFilter} onValueChange={setIssueTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Issue Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="electricity">Electricity</SelectItem>
                <SelectItem value="road">Road</SelectItem>
                <SelectItem value="garbage">Garbage</SelectItem>
                <SelectItem value="sewerage">Sewerage</SelectItem>
              </SelectContent>
            </Select>
            <Select value={wardFilter} onValueChange={setWardFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ward" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wards</SelectItem>
                {Array.from({ length: 100 }, (_, i) => i + 1).map((ward) => (
                  <SelectItem key={ward} value={ward.toString()}>
                    Ward {ward}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Issues Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : filteredIssues.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No issues found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Parshad</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.map((issue) => {
                  const issueType = issueTypeLabels[issue.issue_type] || {
                    en: issue.issue_type,
                    hi: issue.issue_type,
                    color: "bg-gray-500",
                  };
                  const status = statusLabels[issue.status] || {
                    label: issue.status,
                    color: "bg-gray-100 text-gray-800",
                  };

                  return (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${issueType.color}`} />
                          <span className="font-medium">{issueType.hi}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          Ward {issue.ward_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {issue.assigned_parshad ? (
                          <div className="flex flex-col">
                            <span className="text-sm">{issue.assigned_parshad.name}</span>
                            {issue.assignment_message && (
                              <span className="text-xs text-muted-foreground">{issue.assignment_message}</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-muted-foreground text-sm">Not assigned</span>
                            {issue.assignment_message && (
                              <span className="text-xs text-orange-600">{issue.assignment_message}</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(issue.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(issue)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {issue.status === "reported" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignClick(issue)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} issues
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Assign Parshad Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Parshad</DialogTitle>
            <DialogDescription>
              Select a Parshad to assign this issue to for verification and oversight.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedIssue && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="font-medium">
                  {issueTypeLabels[selectedIssue.issue_type]?.hi || selectedIssue.issue_type}
                </p>
                <p className="text-sm text-muted-foreground">
                  Ward {selectedIssue.ward_number}
                </p>
              </div>
            )}
            <Select value={selectedParshadId} onValueChange={setSelectedParshadId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Parshad" />
              </SelectTrigger>
              <SelectContent>
                {parshads.map((parshad) => (
                  <SelectItem key={parshad.id} value={parshad.id.toString()}>
                    {parshad.name} (Ward {parshad.ward_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedParshadId || isAssigning}>
              {isAssigning ? "Assigning..." : "Assign Parshad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Issue Details</DialogTitle>
          </DialogHeader>
          {detailIssue && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Issue Type</p>
                  <p className="font-medium">
                    {issueTypeLabels[detailIssue.issue_type]?.hi || detailIssue.issue_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={statusLabels[detailIssue.status]?.color}
                  >
                    {statusLabels[detailIssue.status]?.label || detailIssue.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ward</p>
                  <p className="font-medium">Ward {detailIssue.ward_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Reported</p>
                  <p className="font-medium">
                    {new Date(detailIssue.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {detailIssue.address && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{detailIssue.address}</p>
                </div>
              )}

              {detailIssue.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{detailIssue.description}</p>
                </div>
              )}

              {detailIssue.assigned_parshad && (
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Parshad</p>
                  <p className="font-medium">{detailIssue.assigned_parshad.name}</p>
                  {detailIssue.assigned_parshad.ward_number && (
                    <p className="text-sm text-muted-foreground">Ward {detailIssue.assigned_parshad.ward_number}</p>
                  )}
                </div>
              )}

              {detailIssue.assignment_message && (
                <div>
                  <p className="text-sm text-muted-foreground">Assignment Status</p>
                  <p className={`text-sm ${detailIssue.assigned_parshad ? 'text-green-600' : 'text-orange-600'}`}>
                    {detailIssue.assignment_message}
                  </p>
                </div>
              )}

              {detailIssue.images && detailIssue.images.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Images</p>
                  <div className="flex gap-2 flex-wrap">
                    {detailIssue.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Issue image ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
