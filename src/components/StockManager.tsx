"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Stock {
  id: number;
  code: string;
  name: string;
  sector: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface StockFormData {
  code: string;
  name: string;
  sector: string;
  description: string;
}

export default function StockManager() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<StockFormData>({
    code: "",
    name: "",
    sector: "",
    description: "",
  });

  const commonSectors = [
    "银行",
    "房地产",
    "白酒",
    "医药",
    "新能源",
    "电子",
    "保险",
    "券商",
    "化工",
    "机械",
    "消费",
    "科技",
    "其他",
  ];

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await fetch("/api/stocks");
      const result = await response.json();
      if (result.success) {
        setStocks(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch stocks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingStock(null);
    setFormData({ code: "", name: "", sector: "", description: "" });
    setIsDialogOpen(true);
  };

  const handleEditClick = (stock: Stock) => {
    setEditingStock(stock);
    setFormData({
      code: stock.code,
      name: stock.name,
      sector: stock.sector,
      description: stock.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = async (code: string, name: string) => {
    if (!confirm(`确定要删除 ${name}(${code}) 吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/stocks/${code}`, {
        method: "DELETE",
      });
      const result = await response.json();
      
      if (result.success) {
        await fetchStocks();
        alert("删除成功");
      } else {
        alert(`删除失败: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to delete stock:", error);
      alert("删除失败");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingStock 
        ? `/api/stocks/${editingStock.code}`
        : "/api/stocks";
      
      const method = editingStock ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchStocks();
        setIsDialogOpen(false);
        alert(editingStock ? "更新成功" : "添加成功");
      } else {
        alert(`${editingStock ? "更新" : "添加"}失败: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to save stock:", error);
      alert("保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">股票管理</h2>
          <p className="text-sm text-muted-foreground">
            管理用于5日趋势核心和5日容量核心的股票池
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddClick}>
              <Plus className="w-4 h-4 mr-2" />
              添加股票
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingStock ? "编辑股票" : "添加新股票"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">股票代码 *</Label>
                <Input
                  id="code"
                  placeholder="例如：600519"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  disabled={!!editingStock} // 编辑时不能修改代码
                  pattern="\d{6}"
                  title="请输入6位数字"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">股票名称 *</Label>
                <Input
                  id="name"
                  placeholder="例如：贵州茅台"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sector">所属板块 *</Label>
                <select
                  id="sector"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  required
                >
                  <option value="">请选择板块</option>
                  {commonSectors.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="description">描述</Label>
                <textarea
                  id="description"
                  placeholder="股票描述（可选）"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md min-h-[80px]"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingStock ? "更新" : "添加"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">加载中...</span>
        </div>
      ) : stocks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          暂无股票，点击"添加股票"开始添加
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">股票代码</TableHead>
                <TableHead>股票名称</TableHead>
                <TableHead>所属板块</TableHead>
                <TableHead>描述</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">{stock.code}</TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {stock.sector}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {stock.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(stock)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(stock.code, stock.name)}
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
