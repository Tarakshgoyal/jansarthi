"use client";

import { useEffect, useState } from "react";
import {
  UserPlus,
  Search,
  Phone,
  MapPin,
  RefreshCw,
  MoreVertical,
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
import { getParshads, createParshad, ParshadInfo } from "@/lib/api";

// Dehradun Nagar Nigam Wards (1-100)
const WARDS = Array.from({ length: 100 }, (_, i) => ({
  number: i + 1,
  name: `Ward ${i + 1}`,
}));

export default function ParshadsPage() {
  const [parshads, setParshads] = useState<ParshadInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Parshad Dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newParshad, setNewParshad] = useState({
    name: "",
    phone: "",
    ward_number: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchParshads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getParshads();
      // Handle both array and object responses
      const parshadList = Array.isArray(data) 
        ? data 
        : ((data as unknown as { items?: ParshadInfo[]; parshads?: ParshadInfo[] })?.items || 
           (data as unknown as { items?: ParshadInfo[]; parshads?: ParshadInfo[] })?.parshads || 
           []);
      setParshads(parshadList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load parshads");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParshads();
  }, []);

  const handleCreateParshad = async () => {
    if (!newParshad.name || !newParshad.phone || !newParshad.ward_number) {
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
        ward_number: parseInt(newParshad.ward_number),
      });

      setShowCreateDialog(false);
      setNewParshad({ name: "", phone: "", ward_number: "" });
      fetchParshads();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create parshad");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredParshads = (parshads || []).filter((parshad) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      parshad.name?.toLowerCase().includes(query) ||
      parshad.ward_number?.toString().includes(query) ||
      parshad.phone?.includes(query)
    );
  });

  // Get wards that already have parshads assigned
  const assignedWards = new Set((parshads || []).map((p) => p.ward_number));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parshad Management</h1>
          <p className="text-muted-foreground">
            Manage ward representatives (पार्षद)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchParshads} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Parshad
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Parshads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parshads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wards Covered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedWards.size} / 100</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wards Vacant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {100 - assignedWards.size}
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
              placeholder="Search parshads by name, ward, or phone..."
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
              {searchQuery ? "No parshads found matching your search" : "No parshads registered yet"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parshad</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Ward</TableHead>
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
                          <p className="text-xs text-muted-foreground">पार्षद</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {parshad.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="secondary">Ward {parshad.ward_number}</Badge>
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
            <DialogTitle>Add New Parshad</DialogTitle>
            <DialogDescription>
              Register a new ward representative (पार्षद) to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Enter parshad name"
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
              <label className="text-sm font-medium">Ward Number</label>
              <Select
                value={newParshad.ward_number}
                onValueChange={(value) => setNewParshad({ ...newParshad, ward_number: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a ward" />
                </SelectTrigger>
                <SelectContent>
                  {WARDS.map((ward) => (
                    <SelectItem
                      key={ward.number}
                      value={ward.number.toString()}
                      disabled={assignedWards.has(ward.number)}
                    >
                      {ward.name}
                      {assignedWards.has(ward.number) && " (Already assigned)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                !newParshad.ward_number
              }
            >
              {isCreating ? "Creating..." : "Create Parshad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
