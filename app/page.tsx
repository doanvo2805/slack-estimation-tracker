'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Estimation } from '@/lib/supabase';
import { ExternalLink, Edit, Trash2, Plus, Search, CheckCircle2, Loader2, BarChart3, Pencil, Check, X, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cleanFundName } from '@/lib/utils';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [estimations, setEstimations] = useState<Estimation[]>([]);
  const [filteredEstimations, setFilteredEstimations] = useState<Estimation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'none' | 'fund' | 'date'>('none');
  const [selectedFundName, setSelectedFundName] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | null>(null);
  const [sortBy, setSortBy] = useState<'fund_asc' | 'fund_desc' | 'date_asc' | 'date_desc' | null>('date_desc'); // Default: newest first
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [estimationToDelete, setEstimationToDelete] = useState<Estimation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null); // Format: "estimationId-fieldName"
  const [editValue, setEditValue] = useState('');
  const [isSavingInline, setIsSavingInline] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (searchParams.get('success') === 'true' || searchParams.get('updated') === 'true') {
      setShowSuccess(true);
      timer = setTimeout(() => setShowSuccess(false), 5000);
    }

    fetchEstimations();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [searchParams]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    applyFilters();
  }, [estimations, debouncedSearchQuery, filterType, selectedFundName, dateFilter, sortBy]);

  const fetchEstimations = async () => {
    try {
      const response = await fetch('/api/estimations');
      if (!response.ok) throw new Error('Failed to fetch estimations');
      const data = await response.json();
      setEstimations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch estimations');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...estimations];

    // Apply search filter (using debounced query)
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (est) =>
          est.fund_name?.toLowerCase().includes(query) ||
          est.items?.toLowerCase().includes(query) ||
          est.ds_estimation?.toLowerCase().includes(query) ||
          est.le_estimation?.toLowerCase().includes(query) ||
          est.qa_estimation?.toLowerCase().includes(query)
      );
    }

    // Apply fund name filter
    if (filterType === 'fund' && selectedFundName) {
      filtered = filtered.filter((est) => est.fund_name === selectedFundName);
    }

    // Apply date filter
    if (filterType === 'date' && dateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((est) => {
        const estDate = new Date(est.created_at);
        const estDay = new Date(estDate.getFullYear(), estDate.getMonth(), estDate.getDate());

        if (dateFilter === 'today') {
          return estDay.getTime() === today.getTime();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return estDay >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setDate(monthAgo.getDate() - 30);
          return estDay >= monthAgo;
        }
        return true;
      });
    }

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        if (sortBy === 'fund_asc') {
          const nameA = (a.fund_name || '').toLowerCase();
          const nameB = (b.fund_name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        } else if (sortBy === 'fund_desc') {
          const nameA = (a.fund_name || '').toLowerCase();
          const nameB = (b.fund_name || '').toLowerCase();
          return nameB.localeCompare(nameA);
        } else if (sortBy === 'date_asc') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        } else if (sortBy === 'date_desc') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0;
      });
    }

    setFilteredEstimations(filtered);
  };

  const getUniqueFundNames = () => {
    const fundNames = estimations
      .map((est) => est.fund_name)
      .filter((name): name is string => !!name);
    return Array.from(new Set(fundNames)).sort();
  };

  const clearFilter = () => {
    setFilterType('none');
    setSelectedFundName(null);
    setDateFilter(null);
  };

  const getActiveFilterLabel = () => {
    if (filterType === 'fund' && selectedFundName) {
      return `Fund: ${cleanFundName(selectedFundName)}`;
    } else if (filterType === 'date' && dateFilter) {
      if (dateFilter === 'today') return 'Date: Today';
      if (dateFilter === 'week') return 'Date: Last 7 days';
      if (dateFilter === 'month') return 'Date: Last 30 days';
    }
    return null;
  };

  const clearSort = () => {
    setSortBy('date_desc'); // Reset to default
  };

  const getActiveSortLabel = () => {
    if (!sortBy || sortBy === 'date_desc') return null; // Don't show badge for default sort
    if (sortBy === 'fund_asc') return 'Fund: A→Z';
    if (sortBy === 'fund_desc') return 'Fund: Z→A';
    if (sortBy === 'date_asc') return 'Date: Oldest';
    return null;
  };

  const getSortIcon = () => {
    if (!sortBy || sortBy === 'date_desc') return null;
    if (sortBy === 'fund_asc' || sortBy === 'date_asc') return <ArrowUp className="h-3 w-3" />;
    if (sortBy === 'fund_desc') return <ArrowDown className="h-3 w-3" />;
    return null;
  };

  const handleDelete = async () => {
    if (!estimationToDelete) return;

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/estimations/${estimationToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete estimation');
      }

      // Remove from local state
      setEstimations(estimations.filter((est) => est.id !== estimationToDelete.id));
      setDeleteDialogOpen(false);
      setEstimationToDelete(null);

      // Show success message (will be managed by useEffect cleanup)
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete estimation');
    } finally {
      setIsDeleting(false);
    }
  };

  const startInlineEdit = (estimationId: string, fieldName: string, currentValue: string | null) => {
    setEditingField(`${estimationId}-${fieldName}`);
    setEditValue(currentValue || '');
  };

  const cancelInlineEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveInlineEdit = async (estimationId: string, fieldName: string) => {
    // Validate: fund_name cannot be empty
    if (fieldName === 'fund_name' && !editValue.trim()) {
      setError('Fund name cannot be empty');
      return;
    }

    setIsSavingInline(true);
    setError('');

    try {
      const response = await fetch(`/api/estimations/${estimationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [fieldName]: editValue.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update field');
      }

      // Update local state
      setEstimations(estimations.map(est =>
        est.id === estimationId
          ? { ...est, [fieldName]: editValue.trim() || null }
          : est
      ));

      // Clear editing state
      setEditingField(null);
      setEditValue('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update field');
    } finally {
      setIsSavingInline(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const renderCellValue = (value: string | null) => {
    return value && value.trim() !== '' ? value : '—';
  };

  const renderEditableCell = (
    estimation: Estimation,
    fieldName: keyof Estimation,
    displayValue: string,
    useTextarea = false
  ) => {
    const fieldKey = `${estimation.id}-${fieldName}`;
    const isEditing = editingField === fieldKey;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          {useTextarea ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="min-h-[60px] text-sm"
              autoFocus
              disabled={isSavingInline}
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-8 text-sm"
              autoFocus
              disabled={isSavingInline}
            />
          )}
          <div className="flex gap-1 flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => saveInlineEdit(estimation.id, fieldName as string)}
              disabled={isSavingInline}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={cancelInlineEdit}
              disabled={isSavingInline}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 group">
        <span className="flex-1">{displayValue}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={() => startInlineEdit(estimation.id, fieldName as string, estimation[fieldName] as string | null)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading estimations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BarChart3 className="h-7 w-7 text-blue-600" />
            <h1 className="text-3xl font-bold">Slack Estimation Tracker</h1>
          </div>
          <p className="text-gray-600">Manage and track team estimations</p>
        </div>
        <Link href="/extract">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Estimation
          </Button>
        </Link>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Estimation saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <Input
            type="text"
            placeholder="Search estimations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search estimations"
          />
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort
                {sortBy && sortBy !== 'date_desc' && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    1
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-3">Sort by</h4>
                  <div className="space-y-1">
                    <Button
                      variant={sortBy === 'fund_asc' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => setSortBy(sortBy === 'fund_asc' ? 'fund_desc' : 'fund_asc')}
                    >
                      <span>Fund Name</span>
                      {sortBy === 'fund_asc' && <span className="text-xs">A→Z</span>}
                      {sortBy === 'fund_desc' && <span className="text-xs">Z→A</span>}
                    </Button>
                    <Button
                      variant={sortBy === 'date_asc' || sortBy === 'date_desc' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => setSortBy(sortBy === 'date_desc' ? 'date_asc' : 'date_desc')}
                    >
                      <span>Date Added</span>
                      {sortBy === 'date_desc' && <span className="text-xs">Newest</span>}
                      {sortBy === 'date_asc' && <span className="text-xs">Oldest</span>}
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
                {filterType !== 'none' && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    1
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-3">Filter by</h4>
                  <div className="space-y-2">
                    <div>
                      <Button
                        variant={filterType === 'fund' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => {
                          if (filterType === 'fund') {
                            clearFilter();
                          } else {
                            setFilterType('fund');
                            setDateFilter(null);
                          }
                        }}
                      >
                        Fund Name
                      </Button>
                      {filterType === 'fund' && (
                        <div className="mt-2 ml-2">
                          <Select
                            value={selectedFundName || ''}
                            onValueChange={(value) => setSelectedFundName(value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select fund..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getUniqueFundNames().map((fundName) => (
                                <SelectItem key={fundName} value={fundName}>
                                  {cleanFundName(fundName)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div>
                      <Button
                        variant={filterType === 'date' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => {
                          if (filterType === 'date') {
                            clearFilter();
                          } else {
                            setFilterType('date');
                            setSelectedFundName(null);
                          }
                        }}
                      >
                        Date Added
                      </Button>
                      {filterType === 'date' && (
                        <div className="mt-2 ml-2 space-y-1">
                          <Button
                            variant={dateFilter === 'today' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => setDateFilter('today')}
                          >
                            Today
                          </Button>
                          <Button
                            variant={dateFilter === 'week' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => setDateFilter('week')}
                          >
                            Last 7 days
                          </Button>
                          <Button
                            variant={dateFilter === 'month' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => setDateFilter('month')}
                          >
                            Last 30 days
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {getActiveSortLabel() && (
            <Badge variant="secondary" className="px-3 py-1.5 flex items-center gap-1">
              {getActiveSortLabel()}
              {getSortIcon()}
              <button
                onClick={clearSort}
                className="ml-1 hover:text-destructive"
                aria-label="Clear sort"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filterType !== 'none' && getActiveFilterLabel() && (
            <Badge variant="secondary" className="px-3 py-1.5">
              {getActiveFilterLabel()}
              <button
                onClick={clearFilter}
                className="ml-2 hover:text-destructive"
                aria-label="Clear filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      </div>

      {/* Result Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredEstimations.length} estimation{filteredEstimations.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      {filteredEstimations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">
            {estimations.length === 0
              ? "No estimations yet. Click 'Add New Estimation' to get started."
              : 'No results found. Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Fund Name</TableHead>
                <TableHead className="w-[150px]">Items</TableHead>
                <TableHead className="w-[150px]">DS Estimation</TableHead>
                <TableHead className="w-[150px]">LE Estimation</TableHead>
                <TableHead className="w-[150px]">QA Estimation</TableHead>
                <TableHead className="w-[80px]">Slack</TableHead>
                <TableHead className="w-[80px]">ClickUp</TableHead>
                <TableHead className="w-[120px]">Date Added</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEstimations.map((estimation) => (
                <TableRow key={estimation.id}>
                  <TableCell className="font-medium">
                    {renderEditableCell(estimation, 'fund_name', cleanFundName(estimation.fund_name))}
                  </TableCell>
                  <TableCell className="w-[150px] max-w-[150px] whitespace-normal break-words">
                    {renderEditableCell(estimation, 'items', renderCellValue(estimation.items), true)}
                  </TableCell>
                  <TableCell className="w-[150px] whitespace-normal break-words">
                    {renderEditableCell(estimation, 'ds_estimation', renderCellValue(estimation.ds_estimation))}
                  </TableCell>
                  <TableCell className="w-[150px] whitespace-normal break-words">
                    {renderEditableCell(estimation, 'le_estimation', renderCellValue(estimation.le_estimation))}
                  </TableCell>
                  <TableCell className="w-[150px] whitespace-normal break-words">
                    {renderEditableCell(estimation, 'qa_estimation', renderCellValue(estimation.qa_estimation))}
                  </TableCell>
                  <TableCell>
                    {estimation.slack_link ? (
                      <a
                        href={estimation.slack_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        aria-label={`Open Slack thread for ${cleanFundName(estimation.fund_name)}`}
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {estimation.clickup_link ? (
                      <a
                        href={estimation.clickup_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        aria-label={`Open ClickUp task for ${cleanFundName(estimation.fund_name)}`}
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{formatDate(estimation.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/edit/${estimation.id}`)}
                        aria-label={`Edit estimation for ${cleanFundName(estimation.fund_name)}`}
                      >
                        <Edit className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEstimationToDelete(estimation);
                          setDeleteDialogOpen(true);
                        }}
                        aria-label={`Delete estimation for ${cleanFundName(estimation.fund_name)}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            // Always reset when dialog closes (via ESC, backdrop, or cancel button)
            setEstimationToDelete(null);
            setError('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Estimation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the estimation for{' '}
              <strong>{cleanFundName(estimationToDelete?.fund_name)}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              autoFocus
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
