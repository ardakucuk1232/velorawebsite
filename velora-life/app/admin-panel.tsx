'use client';

import { EmployeeDialog } from '@/components/admin/employee-dialog';
import { StockDialog } from '@/components/admin/stock-dialog';
import { CustomerPanel } from '@/components/admin/customer-panel';
import { OrderPanel } from '@/components/admin/order-panel';
import { Nav } from '@/components/admin/navigation';
import { EventText } from '@/components/admin/activity-text';
import { Empty } from '@/components/admin/empty-state';
import { Badge } from '@/components/admin/status-badge';
import { Choice } from '@/components/admin/choice';
import { csv } from '@/lib/export-csv';
import { date, sections } from '@/components/admin/config';
import { useState, useEffect, useCallback, useMemo, type CSSProperties } from 'react';
import {
  ShoppingBag,
  Users,
  Network,
  Boxes,
  ChartNoAxesCombined,
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  RefreshCw,
  Search,
  Download,
  Package,
  Truck,
  Clock,
  Wallet,
  AlertTriangle,
  SlidersHorizontal,
  ChevronRight,
  LogOut,
  UserRound,
  Plus,
  ClipboardList,
} from 'lucide-react';
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { SignIn } from '@/app/commerce';
import { money, statuses } from '@/lib/products';
import '@/app/admin.css';
export default function Admin({ session }: { session: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState('overview');
  const [days, setDays] = useState('30');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tümü');
  const [priorityFilter, setPriorityFilter] = useState('Tümü');
  const [paymentFilter, setPaymentFilter] = useState('Tümü');
  const [sort, setSort] = useState('new');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [activityFilter, setActivityFilter] = useState('Tümü');
  const allowed = session?.profile && (session.isOwner || session.profile.role === 'staff');
  const range = useMemo(() => {
    const to = Date.now();
    return {
      from: days === 'all' ? 0 : to - Number(days) * 86400000,
      to,
    };
  }, [days]);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api('/api/admin?from=' + range.from + '&to=' + Date.now()));
      setPage(1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [range]);
  useEffect(() => {
    if (allowed) load();
    else setLoading(false);
  }, [allowed, load]);
  useEffect(() => {
    const key = location.hash.slice(1);
    if (sections.some((s) => s.id === key)) setActive(key);
  }, []);
  useEffect(
    () => setPage(1),
    [search, statusFilter, priorityFilter, paymentFilter, sort, days, active],
  );
  function go(id: string) {
    setActive(id);
    setSearch('');
    history.replaceState(null, '', '#' + id);
  }
  async function mutate(body: any) {
    setBusy(true);
    try {
      await api('/api/admin', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      toast.success('Değişiklikler kaydedildi.');
      await load();
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const members: any[] = data?.members || [];
  const orders: any[] = data?.orders || [];
  const inventory: any[] = data?.inventory || [];
  const activity: any[] = data?.activity || [];
  const summary = data?.summary || {};
  const partners = members.filter((m) => m.partner);
  const team = members.filter((m) => m.role === 'staff' || m.isOwner);
  const query = search.toLocaleLowerCase('tr');
  const filtered = orders
    .filter(
      (o) =>
        (statusFilter === 'Tümü' || o.status === statusFilter) &&
        (priorityFilter === 'Tümü' || o.priority === priorityFilter) &&
        (paymentFilter === 'Tümü' || o.payment_status === paymentFilter) &&
        [o.number, o.name, o.email, o.city, o.tracking]
          .join(' ')
          .toLocaleLowerCase('tr')
          .includes(query),
    )
    .sort((a, b) =>
      sort === 'value'
        ? b.total - a.total
        : sort === 'old'
          ? a.created - b.created
          : b.created - a.created,
    );
  const customers = members.filter((m) =>
    [m.name, m.email, m.phone, m.city].join(' ').toLocaleLowerCase('tr').includes(query),
  );
  const pendingStock = inventory.filter((p) => p.stock !== null && p.stock <= p.reorder);
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const points = data?.daily?.length
    ? data.daily
    : [
        {
          date: new Date(range.from || Date.now()).toISOString().slice(0, 10),
          value: 0,
          count: 0,
        },
        {
          date: new Date().toISOString().slice(0, 10),
          value: 0,
          count: 0,
        },
      ];
  if (!session?.identity) return <SignIn />;
  if (!session.profile)
    return (
      <div className="content-page empty-state">
        <ShieldCheck size={44} />
        <h1 className="page-title">Velora yönetim merkezi</h1>
        <p>
          Devam etmek için üyelik profilini tamamla.
          <br />
          Yönetici, üyeliğine çalışan yetkisi verebilir.
        </p>
        <a className="button" href="/account">
          Üyelik profilini tamamla <ArrowRight size={16} />
        </a>
      </div>
    );
  if (!allowed)
    return (
      <div className="content-page empty-state">
        <ShieldCheck size={44} />
        <h1 className="page-title">Yetkili çalışan alanı</h1>
        <p>
          Bu hesabın yönetim yetkisi bulunmuyor.
          <br />
          Site yöneticisi hesabına çalışan yetkisi verebilir.
        </p>
        <a className="button" href="/account">
          Hesabıma dön
        </a>
      </div>
    );
  function orderRows(list: any[], compact = false) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sipariş / tarih</TableHead>
            <TableHead>Müşteri</TableHead>
            {!compact && <TableHead>Öncelik</TableHead>}
            <TableHead>Durum</TableHead>
            {!compact && <TableHead>Sorumlu</TableHead>}
            <TableHead className="text-right">Tutar</TableHead>
            <TableHead className="text-right">İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                <button className="erp-order-link" onClick={() => setSelectedOrder(o)}>
                  {o.number}
                </button>
                <small>{date(o.created)}</small>
              </TableCell>
              <TableCell>
                <strong>{o.name}</strong>
                <small>{o.city}</small>
              </TableCell>
              {!compact && (
                <TableCell>
                  <Badge value={o.priority} />
                </TableCell>
              )}
              <TableCell>
                <Badge value={o.status} />
                {!compact && <small>{o.payment_status}</small>}
              </TableCell>
              {!compact && <TableCell>{o.assigned_name || 'Atanmadı'}</TableCell>}
              <TableCell className="text-right font-semibold">{money(o.total)}</TableCell>
              <TableCell className="text-right">
                <button
                  className="erp-row-action"
                  onClick={() => setSelectedOrder(o)}
                  aria-label={o.number + ' detayları'}
                >
                  <ArrowUpRight size={17} />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
  function chart() {
    return (
      <div className="erp-chart" role="img" aria-label="Seçilen dönemde günlük sipariş tutarları">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={points}
            margin={{
              top: 15,
              right: 12,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="velora-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#87ad66" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#87ad66" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="4 5" stroke="#e9eee9" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => v.slice(8) + '/' + v.slice(5, 7)}
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 12,
                fill: '#809084',
              }}
              minTickGap={25}
            />
            <YAxis
              tickFormatter={(v) => (v >= 1000 ? v / 1000 + 'B' : v)}
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 12,
                fill: '#809084',
              }}
              width={44}
            />
            <Tooltip
              formatter={(v: any) => [money(Number(v)), 'Sipariş tutarı']}
              labelFormatter={(v) => 'Tarih: ' + v}
              contentStyle={{
                borderRadius: 10,
                border: '1px solid #e1e8e0',
                fontSize: 13,
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#2d6544"
              strokeWidth={2.5}
              fill="url(#velora-area)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        {!data?.daily?.length && (
          <p className="erp-chart-note">Bu dönemde henüz sipariş kaydı yok.</p>
        )}
      </div>
    );
  }
  return (
    <SidebarProvider
      className="enterprise"
      style={
        {
          '--sidebar-width': '252px',
        } as CSSProperties
      }
    >
      <Sidebar className="erp-sidebar">
        <SidebarHeader className="erp-logo">
          <a href="/admin" className="brand">
            velora<sup>✳</sup>
          </a>
          <span>YÖNETİM MERKEZİ</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <Nav active={active} go={go} pending={summary.pending || 0} />
            </SidebarMenu>
          </SidebarGroup>
          <div className="erp-sidebar-info">
            <ShieldCheck size={19} />
            <strong>Kurumsal çalışma alanı</strong>
            <p>Siparişler, ekip ve operasyon tek merkezde.</p>
            <a href="/">
              Mağazayı görüntüle <ArrowUpRight size={14} />
            </a>
          </div>
        </SidebarContent>
        <SidebarFooter className="erp-sidebar-footer">
          <div className="erp-avatar">{session.profile.name.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{session.profile.name}</strong>
            <small>{session.isOwner ? 'Site yöneticisi' : 'Operasyon çalışanı'}</small>
          </div>
          <form action="/api/auth/logout" method="post" className="logout-form">
            <button type="submit" aria-label="Çıkış yap">
              <LogOut size={17} />
            </button>
          </form>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="erp-inset">
        <header className="erp-topbar">
          <div className="erp-breadcrumb">
            <SidebarTrigger aria-label="Menüyü aç veya kapat" />
            <span>Yönetim</span>
            <ChevronRight size={14} />
            <strong>{sections.find((s) => s.id === active)?.label}</strong>
          </div>
          <div className="erp-top-actions">
            <span className="erp-date">{date(Date.now())}</span>
            <a className="erp-icon" href="/account" aria-label="Hesabım">
              <UserRound size={18} />
            </a>
          </div>
        </header>
        <main className="erp-main">
          <div className="erp-page-heading">
            <div>
              <span className="erp-kicker">VELORA LIFE / OPERASYON</span>
              <h1>{sections.find((s) => s.id === active)?.label}</h1>
              <p>
                {
                  (
                    {
                      overview: 'İşletmenin güncel durumunu takip et, öncelikli işlere odaklan.',
                      orders: 'Siparişten teslimata tüm süreci tek yerden yönet.',
                      customers: 'Müşteri bilgileri, sipariş geçmişi ve kurumsal notlar.',
                      community: 'Üyelik ilişkileri ve davet ağına bütüncül bir bakış.',
                      inventory: 'Ürün kataloğu, depo konumları ve stok hareketleri.',
                      reports: 'Sipariş verilerinden oluşan dönemsel satış özeti.',
                      team: 'Çalışan erişimleri, departmanlar ve görevler.',
                      activity: 'Kim, ne zaman, hangi işlemi yaptı?',
                    } as any
                  )[active]
                }
              </p>
            </div>
            <div className="erp-heading-actions">
              {['overview', 'orders', 'reports'].includes(active) && (
                <Choice
                  label="Rapor dönemi"
                  value={days}
                  onChange={setDays}
                  values={[
                    ['7', 'Son 7 gün'],
                    ['30', 'Son 30 gün'],
                    ['90', 'Son 90 gün'],
                    ['all', 'Tüm zamanlar'],
                  ]}
                />
              )}
              <button className="erp-btn secondary" onClick={load} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'erp-spin' : ''} />
                <span>Yenile</span>
              </button>
            </div>
          </div>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {loading && !data ? (
            <div className="erp-loading" role="status">
              <RefreshCw className="erp-spin" size={26} />
              Operasyon verileri yükleniyor…
            </div>
          ) : (
            <>
              {active === 'overview' && (
                <>
                  <div className="erp-kpis">
                    {[
                      {
                        label: 'Toplam sipariş tutarı',
                        value: money(summary.value || 0),
                        icon: Wallet,
                        note: 'İptaller hariç · seçili dönem',
                        featured: true,
                      },
                      {
                        label: 'Toplam sipariş',
                        value: summary.total || 0,
                        icon: ShoppingBag,
                        note: (summary.delivered || 0) + ' teslim edilen sipariş',
                      },
                      {
                        label: 'İşlem bekleyen',
                        value: summary.pending || 0,
                        icon: Clock,
                        note: 'Yeni ve hazırlanan siparişler',
                      },
                      {
                        label: 'Kayıtlı müşteri',
                        value: members.length,
                        icon: Users,
                        note: partners.length + ' topluluk üyesi · tüm zamanlar',
                      },
                    ].map((k) => (
                      <article
                        className={'erp-kpi ' + (k.featured ? 'featured' : '')}
                        key={k.label}
                      >
                        <div>
                          <span>{k.label}</span>
                          <k.icon size={19} />
                        </div>
                        <strong>{k.value}</strong>
                        <p>{k.note}</p>
                      </article>
                    ))}
                  </div>
                  <div className="erp-dashboard-grid">
                    <section className="erp-card">
                      <div className="erp-card-heading">
                        <div>
                          <h2>Sipariş performansı</h2>
                          <p>Günlük sipariş tutarı · ₺</p>
                        </div>
                        <button className="erp-text-button" onClick={() => go('reports')}>
                          Raporu aç <ArrowUpRight size={15} />
                        </button>
                      </div>
                      {chart()}
                    </section>
                    <section className="erp-card">
                      <div className="erp-card-heading">
                        <div>
                          <h2>Operasyon gündemi</h2>
                          <p>Takip etmen gereken işler</p>
                        </div>
                        <ClipboardList size={20} />
                      </div>
                      <div className="erp-agenda">
                        <button
                          onClick={() => {
                            go('orders');
                            setStatusFilter('Alındı');
                          }}
                        >
                          <span className="erp-task-icon amber">
                            <Package size={19} />
                          </span>
                          <div>
                            <strong>Yeni siparişler</strong>
                            <small>Hazırlık için incele</small>
                          </div>
                          <b>{orders.filter((o) => o.status === 'Alındı').length}</b>
                          <ChevronRight size={15} />
                        </button>
                        <button
                          onClick={() => {
                            go('orders');
                            setStatusFilter('Kargoya verildi');
                          }}
                        >
                          <span className="erp-task-icon blue">
                            <Truck size={19} />
                          </span>
                          <div>
                            <strong>Kargodaki siparişler</strong>
                            <small>Teslimat durumunu takip et</small>
                          </div>
                          <b>{summary.shipped || 0}</b>
                          <ChevronRight size={15} />
                        </button>
                        <button onClick={() => go('inventory')}>
                          <span className="erp-task-icon red">
                            <Boxes size={19} />
                          </span>
                          <div>
                            <strong>Kritik stoklar</strong>
                            <small>Depo durumunu kontrol et</small>
                          </div>
                          <b>{pendingStock.length}</b>
                          <ChevronRight size={15} />
                        </button>
                      </div>
                      <div className="erp-info-strip">
                        <ShieldCheck size={16} />
                        <span>Değişiklikler çalışan adı ve zamanıyla kaydedilir.</span>
                      </div>
                    </section>
                  </div>
                  <div className="erp-dashboard-grid lower">
                    <section className="erp-card">
                      <div className="erp-card-heading">
                        <div>
                          <h2>Son siparişler</h2>
                          <p>Seçili dönemdeki son kayıtlar</p>
                        </div>
                        <button className="erp-text-button" onClick={() => go('orders')}>
                          Tümünü gör <ArrowRight size={15} />
                        </button>
                      </div>
                      {orders.length ? (
                        orderRows(orders.slice(0, 5), true)
                      ) : (
                        <Empty description="Müşterilerin oluşturduğu siparişler burada listelenecek." />
                      )}
                    </section>
                    <section className="erp-card">
                      <div className="erp-card-heading">
                        <h2>Son hareketler</h2>
                        <button
                          className="erp-text-button"
                          onClick={() => go('activity')}
                          aria-label="İşlem geçmişini aç"
                        >
                          <ArrowUpRight size={16} />
                        </button>
                      </div>
                      {activity.length ? (
                        <div className="erp-timeline">
                          {activity.slice(0, 4).map((e) => (
                            <article key={e.id}>
                              <span />
                              <div>
                                <EventText event={e} />
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <Empty
                          title="İşlem geçmişi temiz."
                          description="Operasyon değişiklikleri burada görünecek."
                        />
                      )}
                    </section>
                  </div>
                  <p className="erp-footnote">
                    Sipariş tutarı tahsil edilmiş gelir değildir. Ödeme kayıtları çalışanlar
                    tarafından manuel güncellenir.
                  </p>
                </>
              )}
              {active === 'orders' && (
                <>
                  <div className="erp-status-row">
                    {['Tümü', ...statuses].map((s) => (
                      <button
                        key={s}
                        className={statusFilter === s ? 'active' : ''}
                        onClick={() => setStatusFilter(s)}
                      >
                        {s === 'Tümü' ? 'Tüm siparişler' : s}
                        <span>
                          {s === 'Tümü'
                            ? orders.length
                            : orders.filter((o) => o.status === s).length}
                        </span>
                      </button>
                    ))}
                  </div>
                  <section className="erp-card">
                    <div className="erp-toolbar">
                      <label className="erp-search">
                        <Search size={17} />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Sipariş no, müşteri, şehir veya kargo ara"
                          aria-label="Sipariş ara"
                        />
                      </label>
                      <button
                        className="erp-btn secondary"
                        disabled={!filtered.length}
                        onClick={() =>
                          csv(
                            'velora-siparisler.csv',
                            [
                              'Sipariş',
                              'Müşteri',
                              'E-posta',
                              'Tarih',
                              'Durum',
                              'Öncelik',
                              'Ödeme',
                              'Tutar',
                              'Kargo',
                            ],
                            filtered.map((o) => [
                              o.number,
                              o.name,
                              o.email,
                              date(o.created),
                              o.status,
                              o.priority,
                              o.payment_status,
                              o.total,
                              o.tracking,
                            ]),
                          )
                        }
                      >
                        <Download size={16} />
                        CSV indir
                      </button>
                    </div>
                    <div className="erp-filters">
                      <SlidersHorizontal size={16} />
                      <Choice
                        label="Öncelik filtresi"
                        value={priorityFilter}
                        onChange={setPriorityFilter}
                        values={[['Tümü', 'Tüm öncelikler'], 'Normal', 'Yüksek', 'Acil']}
                      />
                      <Choice
                        label="Ödeme filtresi"
                        value={paymentFilter}
                        onChange={setPaymentFilter}
                        values={[
                          ['Tümü', 'Tüm ödeme durumları'],
                          'Bekliyor',
                          'Tahsil edildi',
                          'İade edildi',
                        ]}
                      />
                      <Choice
                        label="Sipariş sırası"
                        value={sort}
                        onChange={setSort}
                        values={[
                          ['new', 'En yeni önce'],
                          ['old', 'En eski önce'],
                          ['value', 'Tutar: yüksekten düşüğe'],
                        ]}
                      />
                      <button
                        className="erp-text-button"
                        onClick={() => {
                          setStatusFilter('Tümü');
                          setPriorityFilter('Tümü');
                          setPaymentFilter('Tümü');
                          setSearch('');
                        }}
                      >
                        Filtreleri temizle
                      </button>
                    </div>
                    {filtered.length ? (
                      orderRows(filtered.slice((page - 1) * pageSize, page * pageSize))
                    ) : (
                      <Empty
                        title={
                          search || statusFilter !== 'Tümü'
                            ? 'Eşleşen sipariş bulunamadı.'
                            : 'Henüz sipariş yok.'
                        }
                        description="Tarih aralığını veya filtreleri değiştirebilirsin."
                      />
                    )}
                    <div className="erp-table-footer">
                      <span>
                        {filtered.length} kayıt · Sayfa {page} / {pages}
                      </span>
                      <Pagination className="w-auto mx-0">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              aria-label="Önceki sayfa"
                              aria-disabled={page === 1}
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(Math.max(1, page - 1));
                              }}
                            />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              aria-label="Sonraki sayfa"
                              aria-disabled={page === pages}
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(Math.min(pages, page + 1));
                              }}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </section>
                  <p className="erp-footnote">
                    Liste ve CSV seçili dönemin son 500 kaydını kapsar. Dönemde toplam{' '}
                    {summary.total || 0} sipariş var; raporlar tüm kayıtları kullanır.
                  </p>
                </>
              )}
              {active === 'customers' && (
                <section className="erp-card">
                  <div className="erp-toolbar">
                    <label className="erp-search">
                      <Search size={17} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Ad, e-posta, telefon veya şehir"
                        aria-label="Müşteri ara"
                      />
                    </label>
                    <span className="erp-count">{customers.length} müşteri</span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>İletişim</TableHead>
                        <TableHead>Segment</TableHead>
                        <TableHead>Sipariş</TableHead>
                        <TableHead>Toplam tutar</TableHead>
                        <TableHead>Kayıt</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>
                            <div className="erp-person">
                              <div className="erp-avatar light">{m.name.slice(0, 1)}</div>
                              <div>
                                <strong>{m.name}</strong>
                                <small>{m.city || 'Şehir belirtilmedi'}</small>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {m.email}
                            <small>{m.phone}</small>
                          </TableCell>
                          <TableCell>
                            <Badge value={m.segment} />
                          </TableCell>
                          <TableCell>{m.order_count}</TableCell>
                          <TableCell className="font-semibold">{money(m.order_value)}</TableCell>
                          <TableCell>{date(m.created)}</TableCell>
                          <TableCell>
                            <button
                              className="erp-row-action"
                              aria-label={m.name + ' müşteri kartı'}
                              onClick={() => setSelectedCustomer(m)}
                            >
                              <ArrowUpRight size={17} />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {!customers.length && <Empty title="Müşteri bulunamadı." />}
                  <div className="erp-table-footer">
                    <span>Sipariş sayıları ve tutarları tüm zamanları kapsar.</span>
                  </div>
                </section>
              )}
              {active === 'community' && (
                <>
                  <div className="erp-mini-kpis">
                    <article>
                      <Network size={23} />
                      <div>
                        <span>Topluluk üyesi</span>
                        <strong>{partners.length}</strong>
                      </div>
                    </article>
                    <article>
                      <Users size={23} />
                      <div>
                        <span>Davetle katılan</span>
                        <strong>{members.filter((m) => m.sponsor).length}</strong>
                      </div>
                    </article>
                    <article>
                      <ShoppingBag size={23} />
                      <div>
                        <span>Topluluk sipariş tutarı</span>
                        <strong>{money(partners.reduce((n, m) => n + m.order_value, 0))}</strong>
                      </div>
                    </article>
                  </div>
                  <section className="erp-card">
                    <div className="erp-card-heading">
                      <div>
                        <h2>Bayi ve topluluk ilişkileri</h2>
                        <p>Doğrudan davet ilişkileri · tüm zamanlar</p>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Üye</TableHead>
                          <TableHead>Davet kodu</TableHead>
                          <TableHead>Bağlı olduğu üye</TableHead>
                          <TableHead>Doğrudan davet</TableHead>
                          <TableHead>Kendi sipariş tutarı</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partners.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell>
                              <strong>{m.name}</strong>
                              <small>{m.email}</small>
                            </TableCell>
                            <TableCell className="font-mono">{m.referral}</TableCell>
                            <TableCell>
                              {members.find((x) => x.referral === m.sponsor)?.name ||
                                'Doğrudan katılım'}
                            </TableCell>
                            <TableCell>
                              {members.filter((x) => x.sponsor === m.referral).length} üye
                            </TableCell>
                            <TableCell>{money(m.order_value)}</TableCell>
                            <TableCell>
                              <button
                                className="erp-row-action"
                                onClick={() => setSelectedCustomer(m)}
                                aria-label={m.name + ' ayrıntıları'}
                              >
                                <ArrowUpRight size={17} />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {!partners.length && (
                      <Empty
                        title="Topluluk henüz büyümeye başlamadı."
                        description="Topluluk seçeneğini açan üyeler ve davet ilişkileri burada görünür."
                      />
                    )}
                  </section>
                  <div className="erp-info-strip">
                    <Network size={18} />
                    <span>
                      Bu alan üyelik ve davet ilişkilerini izler. Komisyon, kademe veya kazanç
                      ödemesi hesaplanmaz.
                    </span>
                  </div>
                </>
              )}
              {active === 'inventory' && (
                <>
                  {inventory.some((p) => p.stock === null) && (
                    <div className="erp-info-strip">
                      <Boxes size={18} />
                      <span>
                        {inventory.filter((p) => p.stock === null).length} ürünün açılış stoku henüz
                        tanımlanmadı. İlgili ürünün <strong>Stok işlemi</strong> düğmesinden ilk
                        sayımını gir.
                      </span>
                    </div>
                  )}
                  <div className="erp-mini-kpis">
                    <article>
                      <Boxes size={23} />
                      <div>
                        <span>Katalogdaki ürün</span>
                        <strong>{inventory.length}</strong>
                      </div>
                    </article>
                    <article>
                      <Package size={23} />
                      <div>
                        <span>Tanımlı depo stoku</span>
                        <strong>
                          {inventory.reduce((n, p) => n + (p.stock || 0), 0)}
                          <small>adet</small>
                        </strong>
                      </div>
                    </article>
                    <article>
                      <AlertTriangle size={23} />
                      <div>
                        <span>Kritik stok</span>
                        <strong>
                          {pendingStock.length}
                          <small>ürün</small>
                        </strong>
                      </div>
                    </article>
                  </div>
                  <section className="erp-card">
                    <div className="erp-card-heading">
                      <div>
                        <h2>Ürün ve depo listesi</h2>
                        <p>Sipariş oluşturulduğunda stok otomatik düşer.</p>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ürün / SKU</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Satış fiyatı</TableHead>
                          <TableHead>Depo konumu</TableHead>
                          <TableHead>Stok</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead>İşlem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventory.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <div className="erp-product">
                                <img src={p.image} alt={p.name} />
                                <div>
                                  <strong>{p.name}</strong>
                                  <small>{p.sku}</small>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{p.category}</TableCell>
                            <TableCell>{money(p.price)}</TableCell>
                            <TableCell>{p.location || 'Tanımlanmadı'}</TableCell>
                            <TableCell>
                              <strong>{p.stock ?? '—'}</strong>
                              <small>Kritik eşik: {p.reorder}</small>
                            </TableCell>
                            <TableCell>
                              <Badge
                                value={
                                  p.stock === null
                                    ? 'Tanımlanmadı'
                                    : p.stock === 0
                                      ? 'Tükendi'
                                      : p.stock <= p.reorder
                                        ? 'Kritik'
                                        : 'Yeterli'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <button
                                className="erp-btn secondary small"
                                onClick={() => setSelectedProduct(p)}
                              >
                                <Plus size={15} />
                                Stok işlemi
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </section>
                  <div className="erp-info-strip">
                    <AlertTriangle size={18} />
                    <span>
                      Sipariş alabilmek için depo stoklarını tanımla. Kargoya verilmeden iptal
                      edilen siparişlerin stoğu otomatik iade edilir. Kargodan dönen ürünler
                      fiziksel teslim sonrası açıklamalı girişle eklenir.
                    </span>
                  </div>
                </>
              )}
              {active === 'reports' && (
                <>
                  <div className="erp-kpis">
                    {[
                      ['Sipariş tutarı', money(summary.value || 0), 'İptaller hariç'],
                      [
                        'Ortalama sepet',
                        money(
                          summary.total - summary.cancelled > 0
                            ? summary.value / (summary.total - summary.cancelled)
                            : 0,
                        ),
                        'İptaller hariç sipariş başına',
                      ],
                      [
                        'Teslimat oranı',
                        summary.total
                          ? Math.round((summary.delivered / summary.total) * 100) + '%'
                          : '—',
                        'Dönemde oluşturulan siparişler',
                      ],
                      [
                        'Tahsilat kaydı',
                        money(summary.collected || 0),
                        'Çalışanların manuel kayıtları',
                      ],
                    ].map(([l, v, n]) => (
                      <article className="erp-kpi" key={l}>
                        <div>
                          <span>{l}</span>
                          <ChartNoAxesCombined size={18} />
                        </div>
                        <strong>{v}</strong>
                        <p>{n}</p>
                      </article>
                    ))}
                  </div>
                  <section className="erp-card">
                    <div className="erp-card-heading">
                      <div>
                        <h2>Dönemsel sipariş tutarı</h2>
                        <p>İptaller hariç · tüm dönem kayıtları</p>
                      </div>
                      <button
                        className="erp-btn secondary"
                        disabled={!data?.daily?.length}
                        onClick={() =>
                          csv(
                            'velora-gunluk-rapor.csv',
                            ['Tarih', 'Sipariş adedi', 'Sipariş tutarı'],
                            data.daily.map((d: any) => [d.date, d.count, d.value]),
                          )
                        }
                      >
                        <Download size={16} />
                        Rapor indir
                      </button>
                    </div>
                    {chart()}
                  </section>
                  <div
                    className="erp-dashboard-grid"
                    style={{
                      marginTop: 22,
                    }}
                  >
                    <section className="erp-card">
                      <div className="erp-card-heading">
                        <h2>Ürün performansı</h2>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ürün</TableHead>
                            <TableHead>Adet</TableHead>
                            <TableHead className="text-right">Ürün tutarı</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.ranking?.map((p: any) => (
                            <TableRow key={p.id}>
                              <TableCell>{p.name}</TableCell>
                              <TableCell>{p.quantity}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {money(p.value)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {!data?.ranking?.length && <Empty title="Henüz ürün satışı yok." />}
                    </section>
                    <section className="erp-card">
                      <div className="erp-card-heading">
                        <h2>Sipariş dağılımı</h2>
                      </div>
                      <div className="erp-distribution">
                        {[
                          ['İşlem bekleyen', summary.pending],
                          ['Kargoda', summary.shipped],
                          ['Teslim edildi', summary.delivered],
                          ['İptal edildi', summary.cancelled],
                        ].map(([label, n]) => (
                          <div key={label}>
                            <div>
                              <span>{label}</span>
                              <strong>{n || 0}</strong>
                            </div>
                            <div className="erp-bar-track">
                              <span
                                style={{
                                  width: summary.total
                                    ? (Number(n) / summary.total) * 100 + '%'
                                    : '0%',
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                  <p className="erp-footnote">
                    Sipariş tutarına kargo dahildir; ürün performansı kargoyu içermez. Tahsilat
                    alanı banka veya muhasebe entegrasyonundan beslenmez.
                  </p>
                </>
              )}
              {active === 'team' && (
                <>
                  <div className="erp-info-strip">
                    <ShieldCheck size={18} />
                    <span>
                      {session.isOwner
                        ? 'Kayıtlı üyelere çalışan erişimi ver, departman ve unvan tanımla.'
                        : 'Yetkileri görüntüleyebilirsin. Erişim değişikliklerini site yöneticisi yapar.'}
                    </span>
                  </div>
                  <section className="erp-card">
                    <div className="erp-toolbar">
                      <div>
                        <h2>Ekip dizini</h2>
                        <p className="erp-subtext">{team.length} yetkili hesap</p>
                      </div>
                      {session.isOwner && (
                        <button
                          className="erp-btn"
                          onClick={() =>
                            setSelectedEmployee({
                              id: '',
                              role: 'staff',
                              department: '',
                              title: '',
                            })
                          }
                        >
                          <Plus size={16} />
                          Çalışan yetkilendir
                        </button>
                      )}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Çalışan</TableHead>
                          <TableHead>Departman / unvan</TableHead>
                          <TableHead>Yetki</TableHead>
                          <TableHead>Atanan sipariş</TableHead>
                          <TableHead>İşlem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {team.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell>
                              <div className="erp-person">
                                <div className="erp-avatar light">{m.name.slice(0, 1)}</div>
                                <div>
                                  <strong>{m.name}</strong>
                                  <small>{m.email}</small>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {m.department || 'Belirtilmedi'}
                              <small>{m.title || '—'}</small>
                            </TableCell>
                            <TableCell>
                              <Badge value={m.isOwner ? 'Site yöneticisi' : 'Çalışan'} />
                            </TableCell>
                            <TableCell>
                              {orders.filter((o) => o.assigned_to === m.id).length}
                              <small>Seçili dönemdeki listede</small>
                            </TableCell>
                            <TableCell>
                              {session.isOwner && !m.isOwner ? (
                                <button
                                  className="erp-text-button"
                                  onClick={() => setSelectedEmployee(m)}
                                >
                                  Düzenle <ArrowUpRight size={15} />
                                </button>
                              ) : (
                                <span className="erp-subtext">
                                  {m.isOwner ? 'Korunan hesap' : 'Salt okunur'}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </section>
                  <div className="erp-permissions">
                    <div>
                      <ShieldCheck size={22} />
                      <h3>Site yöneticisi</h3>
                      <p>Tüm operasyon ekranları, çalışan yetkilendirme ve erişim kaldırma.</p>
                    </div>
                    <div>
                      <UserRound size={22} />
                      <h3>Çalışan</h3>
                      <p>
                        Sipariş yönetimi, müşteri notları, stok hareketleri ve rapor görüntüleme.
                      </p>
                    </div>
                    <div>
                      <Users size={22} />
                      <h3>Müşteri</h3>
                      <p>Kendi profili, sepeti ve siparişleri. Yönetim paneline erişim yok.</p>
                    </div>
                  </div>
                </>
              )}
              {active === 'activity' && (
                <section className="erp-card">
                  <div className="erp-toolbar">
                    <div>
                      <h2>Operasyon kayıtları</h2>
                      <p className="erp-subtext">Son 100 işlem · tüm zamanlar</p>
                    </div>
                    <Choice
                      label="İşlem türü"
                      value={activityFilter}
                      onChange={setActivityFilter}
                      values={[
                        ['Tümü', 'Tüm işlemler'],
                        ['order', 'Sipariş işlemleri'],
                        ['inventory', 'Stok işlemleri'],
                        ['member', 'Müşteri / çalışan'],
                      ]}
                    />
                  </div>
                  {activity.filter((e) => activityFilter === 'Tümü' || e.entity === activityFilter)
                    .length ? (
                    <div className="erp-audit-list">
                      {activity
                        .filter((e) => activityFilter === 'Tümü' || e.entity === activityFilter)
                        .map((e) => (
                          <article key={e.id}>
                            <div className="erp-task-icon gray">
                              {e.entity === 'order' ? (
                                <ShoppingBag size={18} />
                              ) : e.entity === 'inventory' ? (
                                <Boxes size={18} />
                              ) : (
                                <UserRound size={18} />
                              )}
                            </div>
                            <div>
                              <EventText event={e} />
                            </div>
                            {e.entity === 'order' && orders.some((o) => o.id === e.entity_id) && (
                              <button
                                className="erp-row-action"
                                aria-label="Siparişi aç"
                                onClick={() =>
                                  setSelectedOrder(orders.find((o) => o.id === e.entity_id))
                                }
                              >
                                <ArrowUpRight size={17} />
                              </button>
                            )}
                          </article>
                        ))}
                    </div>
                  ) : (
                    <Empty title="Bu türde bir işlem yok." />
                  )}
                </section>
              )}
            </>
          )}
        </main>
        <footer className="erp-bottom">
          <span>Velora Life · Yönetim merkezi</span>
          <span>Konsept mağaza · Gerçek tahsilat ve gönderim yok.</span>
        </footer>
      </SidebarInset>
      <OrderPanel
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        team={team}
        busy={busy}
        save={async (body) => {
          if (await mutate(body)) setSelectedOrder(null);
        }}
      />
      <CustomerPanel
        member={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        orders={orders}
        members={members}
        busy={busy}
        save={async (body) => {
          if (await mutate(body)) setSelectedCustomer(null);
        }}
      />
      <StockDialog
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        busy={busy}
        save={async (body) => {
          if (await mutate(body)) setSelectedProduct(null);
        }}
      />
      <EmployeeDialog
        employee={selectedEmployee}
        members={members}
        onClose={() => setSelectedEmployee(null)}
        busy={busy}
        save={async (body) => {
          if (await mutate(body)) setSelectedEmployee(null);
        }}
      />
    </SidebarProvider>
  );
}
