"use client";

import { useEffect, useState, useRef } from "react";
import {
  UserPlus,
  Search,
  Phone,
  MapPin,
  RefreshCw,
  MoreVertical,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getParshads, createParshad, getLocalities, createLocality, ParshadInfo, Locality, LocalityType } from "@/lib/api";

interface CSVLocalityRow {
  name: string;
  type: LocalityType;
  status: "pending" | "success" | "error";
  error?: string;
}

export default function ParshadsPage() {
  const [parshads, setParshads] = useState<ParshadInfo[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Parshad Dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newParshad, setNewParshad] = useState({
    name: "",
    phone: "",
    locality_id: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Create Locality Dialog
  const [showCreateLocalityDialog, setShowCreateLocalityDialog] = useState(false);
  const [newLocality, setNewLocality] = useState({
    name: "",
    type: "ward" as LocalityType,
  });
  const [isCreatingLocality, setIsCreatingLocality] = useState(false);
  const [createLocalityError, setCreateLocalityError] = useState<string | null>(null);

  // Bulk Import Dialog
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [csvData, setCsvData] = useState<CSVLocalityRow[]>([]);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkImportProgress, setBulkImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [parshadsData, localitiesData] = await Promise.all([
        getParshads(),
        getLocalities({ is_active: true, page_size: 100 }),
      ]);
      // Handle response formats
      const parshadList = Array.isArray(parshadsData) 
        ? parshadsData 
        : (parshadsData?.items || []);
      setParshads(parshadList);
      setLocalities(localitiesData?.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateParshad = async () => {
    if (!newParshad.name || !newParshad.phone || !newParshad.locality_id) {
      setCreateError("All fields are required");
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      // Add +91 prefix if not present
      const phone = newParshad.phone.startsWith("+91")
        ? newParshad.phone
        : `+91${newParshad.phone.replace(/^91/, "")}`;

      await createParshad({
        name: newParshad.name,
        phone,
        locality_id: parseInt(newParshad.locality_id),
      });

      setShowCreateDialog(false);
      setNewParshad({ name: "", phone: "", locality_id: "" });
      fetchData();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create parshad");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateLocality = async () => {
    if (!newLocality.name || !newLocality.type) {
      setCreateLocalityError("All fields are required");
      return;
    }

    try {
      setIsCreatingLocality(true);
      setCreateLocalityError(null);

      await createLocality({
        name: newLocality.name,
        type: newLocality.type,
      });

      setShowCreateLocalityDialog(false);
      setNewLocality({ name: "", type: "ward" });
      fetchData();
    } catch (err) {
      setCreateLocalityError(err instanceof Error ? err.message : "Failed to create locality");
    } finally {
      setIsCreatingLocality(false);
    }
  };

  // Parse CSV file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      
      // Skip header row if it exists
      const startIndex = lines[0]?.toLowerCase().includes("name") ? 1 : 0;
      
      const parsed: CSVLocalityRow[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle both comma and tab separated values
        const parts = line.includes("\t") ? line.split("\t") : line.split(",");
        const name = parts[0]?.trim().replace(/^["']|["']$/g, "");
        let type = parts[1]?.trim().toLowerCase().replace(/^["']|["']$/g, "") || "ward";
        
        // Normalize type
        if (type === "village" || type === "गांव" || type === "प्रधान") {
          type = "village";
        } else {
          type = "ward";
        }
        
        if (name) {
          parsed.push({
            name,
            type: type as LocalityType,
            status: "pending",
          });
        }
      }
      
      setCsvData(parsed);
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Bulk import localities
  const handleBulkImport = async () => {
    if (csvData.length === 0) return;
    
    setIsBulkImporting(true);
    setBulkImportProgress(0);
    
    const updatedData = [...csvData];
    let successCount = 0;
    
    for (let i = 0; i < updatedData.length; i++) {
      const row = updatedData[i];
      try {
        await createLocality({
          name: row.name,
          type: row.type,
        });
        updatedData[i] = { ...row, status: "success" };
        successCount++;
      } catch (err) {
        updatedData[i] = {
          ...row,
          status: "error",
          error: err instanceof Error ? err.message : "Failed to create",
        };
      }
      setBulkImportProgress(Math.round(((i + 1) / updatedData.length) * 100));
      setCsvData([...updatedData]);
    }
    
    setIsBulkImporting(false);
    
    if (successCount > 0) {
      fetchData();
    }
  };

  const clearBulkImport = () => {
    setCsvData([]);
    setBulkImportProgress(0);
  };

  const filteredParshads = (parshads || []).filter((parshad) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      parshad.name?.toLowerCase().includes(query) ||
      parshad.locality_name?.toLowerCase().includes(query) ||
      parshad.mobile_number?.includes(query) ||
      parshad.phone?.includes(query)
    );
  });

  // Get localities that already have parshads assigned
  const assignedLocalityIds = new Set((parshads || []).map((p) => p.locality_id).filter(Boolean));

  // Available localities for new parshad assignment
  const availableLocalities = localities.filter((loc) => !assignedLocalityIds.has(loc.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Representative Management</h1>
          <p className="text-muted-foreground">
            Manage ward/village representatives (पार्षद/प्रधान)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowBulkImportDialog(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => setShowCreateLocalityDialog(true)} variant="outline">
            <MapPin className="h-4 w-4 mr-2" />
            Add Locality
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Representative
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Representatives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parshads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Localities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Localities Covered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedLocalityIds.size} / {localities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Localities Vacant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {availableLocalities.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, locality, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Parshads Table */}
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
          ) : filteredParshads.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {searchQuery ? "No representatives found matching your search" : "No representatives registered yet"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Representative</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Locality</TableHead>
                  <TableHead>Issues Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParshads.map((parshad) => (
                  <TableRow key={parshad.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {parshad.name?.charAt(0)?.toUpperCase() || "P"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{parshad.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {parshad.locality_type === "village" ? "प्रधान" : "पार्षद"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {parshad.mobile_number || parshad.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="secondary">
                          {parshad.locality_name || `Locality ${parshad.locality_id}`}
                        </Badge>
                        {parshad.locality_type && (
                          <span className="text-xs text-muted-foreground">
                            ({parshad.locality_type === "village" ? "Village" : "Ward"})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {parshad.assigned_issues_count || 0} issues
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>View Assigned Issues</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Parshad Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Representative</DialogTitle>
            <DialogDescription>
              Register a new ward/village representative (पार्षद/प्रधान) to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Enter representative name"
                value={newParshad.name}
                onChange={(e) => setNewParshad({ ...newParshad, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <div className="flex">
                <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm">
                  +91
                </div>
                <Input
                  placeholder="Enter 10-digit phone number"
                  value={newParshad.phone.replace(/^\+?91/, "")}
                  onChange={(e) =>
                    setNewParshad({
                      ...newParshad,
                      phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  className="rounded-l-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Locality (Ward/Village)</label>
              {availableLocalities.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                  No available localities. Please create a locality first.
                </div>
              ) : (
                <Select
                  value={newParshad.locality_id}
                  onValueChange={(value) => setNewParshad({ ...newParshad, locality_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a locality" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLocalities.map((locality) => (
                      <SelectItem key={locality.id} value={locality.id.toString()}>
                        {locality.name} ({locality.type === "village" ? "Village" : "Ward"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {createError && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                {createError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateParshad}
              disabled={
                isCreating ||
                !newParshad.name ||
                newParshad.phone.length !== 10 ||
                !newParshad.locality_id
              }
            >
              {isCreating ? "Creating..." : "Create Representative"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Locality Dialog */}
      <Dialog open={showCreateLocalityDialog} onOpenChange={setShowCreateLocalityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Locality</DialogTitle>
            <DialogDescription>
              Create a new ward or village.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g., Ward 5 or Rajpur Village"
                value={newLocality.name}
                onChange={(e) => setNewLocality({ ...newLocality, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={newLocality.type}
                onValueChange={(value) => setNewLocality({ ...newLocality, type: value as LocalityType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ward">Ward (पार्षद)</SelectItem>
                  <SelectItem value="village">Village (प्रधान)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createLocalityError && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                {createLocalityError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateLocalityDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateLocality}
              disabled={isCreatingLocality || !newLocality.name || !newLocality.type}
            >
              {isCreatingLocality ? "Creating..." : "Create Locality"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImportDialog} onOpenChange={(open) => {
        setShowBulkImportDialog(open);
        if (!open) clearBulkImport();
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Bulk Import Localities</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple wards/villages at once.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto space-y-4 py-4">
            {csvData.length === 0 ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a CSV file with locality names and types
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">CSV Format:</p>
                  <code className="block text-xs bg-background p-2 rounded">
                    name,type<br/>
                    Ward 1,ward<br/>
                    Ward 2,ward<br/>
                    Rajpur Village,village<br/>
                    Doiwala,village
                  </code>
                  <p className="text-xs text-muted-foreground">
                    • First row can be headers (will be skipped if contains &quot;name&quot;)<br/>
                    • Type can be: ward, village (defaults to ward if not specified)<br/>
                    • Supports both comma and tab separated values
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    <span className="font-medium">{csvData.length}</span> localities ready to import
                  </p>
                  <Button variant="ghost" size="sm" onClick={clearBulkImport}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
                
                {isBulkImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Importing...</span>
                      <span>{bulkImportProgress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${bulkImportProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="w-24">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {row.type === "village" ? "Village" : "Ward"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {row.status === "pending" && (
                              <span className="text-muted-foreground text-sm">Pending</span>
                            )}
                            {row.status === "success" && (
                              <span className="text-green-600 flex items-center gap-1 text-sm">
                                <CheckCircle2 className="h-3 w-3" />
                                Done
                              </span>
                            )}
                            {row.status === "error" && (
                              <span className="text-red-600 flex items-center gap-1 text-sm" title={row.error}>
                                <AlertCircle className="h-3 w-3" />
                                Error
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {csvData.some(r => r.status === "error") && (
                  <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm">
                    <p className="font-medium">Some imports failed:</p>
                    <ul className="list-disc list-inside mt-1">
                      {csvData.filter(r => r.status === "error").slice(0, 5).map((r, i) => (
                        <li key={i}>{r.name}: {r.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkImportDialog(false)}>
              {csvData.some(r => r.status === "success") ? "Close" : "Cancel"}
            </Button>
            {csvData.length > 0 && !csvData.every(r => r.status === "success") && (
              <Button
                onClick={handleBulkImport}
                disabled={isBulkImporting || csvData.every(r => r.status !== "pending")}
              >
                {isBulkImporting ? "Importing..." : `Import ${csvData.filter(r => r.status === "pending").length} Localities`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
