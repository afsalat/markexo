import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';
import { RefreshCw, Search, FileText, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Users, Activity, BarChart2 } from 'lucide-react';

interface SEOReportData {
  generated_at: string;
  version: string;
  content_audit: any;
  product_performance: any;
  blog_performance: any;
  order_analytics: any;
  customer_analytics: any;
  seo_health: any;
  indexing: any;
  recommendations: any[];
}

export default function SEOReportsTab() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<SEOReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'recommendations' | 'content' | 'products' | 'analytics'>('overview');

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/admin/seo-reports/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 404) {
        setReportData(null);
      } else if (!res.ok) {
        throw new Error('Failed to fetch SEO report');
      } else {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/admin/seo-reports/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to generate SEO report');
      }
      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [token]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Search className="text-accent-500" />
            SEO & Analytics Reports
          </h1>
          <p className="text-silver-500 text-sm mt-1">
            Comprehensive audit of content, performance, and SEO health.
            {reportData && ` Last updated: ${new Date(reportData.generated_at).toLocaleString()}`}
          </p>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-dark-900 font-bold rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw size={18} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generating...' : 'Regenerate Report'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {!reportData && !loading && !error && (
        <div className="bg-dark-800 rounded-3xl p-12 border border-dark-700 text-center shadow-sm">
          <FileText size={48} className="mx-auto text-dark-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Report Found</h2>
          <p className="text-silver-500 mb-6">You haven't generated an SEO report yet. Click the button below to run the first audit.</p>
          <button
            onClick={generateReport}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 bg-accent-600 hover:bg-accent-500 text-dark-900 font-bold rounded-xl mx-auto transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Running Audit...' : 'Run SEO Audit'}
          </button>
        </div>
      )}

      {reportData && (
        <>
          {/* Sub Navigation */}
          <div className="flex overflow-x-auto space-x-2 pb-2 custom-scrollbar">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeSubTab === 'overview' ? 'bg-accent-500 text-dark-900' : 'bg-dark-800 text-silver-400 hover:text-white hover:bg-dark-700'}`}
            >
              Overview & Health
            </button>
            <button
              onClick={() => setActiveSubTab('recommendations')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeSubTab === 'recommendations' ? 'bg-accent-500 text-dark-900' : 'bg-dark-800 text-silver-400 hover:text-white hover:bg-dark-700'}`}
            >
              Recommendations ({reportData.recommendations.length})
            </button>
            <button
              onClick={() => setActiveSubTab('content')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeSubTab === 'content' ? 'bg-accent-500 text-dark-900' : 'bg-dark-800 text-silver-400 hover:text-white hover:bg-dark-700'}`}
            >
              Content Audit
            </button>
            <button
              onClick={() => setActiveSubTab('products')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeSubTab === 'products' ? 'bg-accent-500 text-dark-900' : 'bg-dark-800 text-silver-400 hover:text-white hover:bg-dark-700'}`}
            >
              Product Performance
            </button>
            <button
              onClick={() => setActiveSubTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeSubTab === 'analytics' ? 'bg-accent-500 text-dark-900' : 'bg-dark-800 text-silver-400 hover:text-white hover:bg-dark-700'}`}
            >
              Business Analytics
            </button>
          </div>

          {/* Sub Tab Content */}
          <div className="space-y-6">
            
            {/* OVERVIEW TAB */}
            {activeSubTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-sm flex flex-col">
                    <span className="text-silver-500 text-sm font-medium uppercase tracking-wider">SEO Health Score</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className={`text-4xl font-black ${reportData.seo_health.overall_score >= 80 ? 'text-accent-500' : reportData.seo_health.overall_score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {reportData.seo_health.overall_score}
                      </span>
                      <span className="text-silver-500">/ 100</span>
                    </div>
                  </div>
                  
                  <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-sm flex flex-col">
                    <span className="text-silver-500 text-sm font-medium uppercase tracking-wider">Indexable Pages</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">{reportData.indexing.products_indexable + reportData.indexing.blogs_indexable + reportData.indexing.categories_indexable}</span>
                    </div>
                    <span className="text-xs text-silver-400 mt-2">{reportData.indexing.products_indexable} products, {reportData.indexing.blogs_indexable} blogs, {reportData.indexing.categories_indexable} cats</span>
                  </div>

                  <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-sm flex flex-col">
                    <span className="text-silver-500 text-sm font-medium uppercase tracking-wider">Pages with Issues</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className={`text-4xl font-black ${reportData.content_audit.summary.pages_with_issues > 0 ? 'text-amber-500' : 'text-accent-500'}`}>
                        {reportData.content_audit.summary.pages_with_issues}
                      </span>
                    </div>
                    <span className="text-xs text-silver-400 mt-2">Missing meta, thin content, etc.</span>
                  </div>

                  <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-sm flex flex-col">
                    <span className="text-silver-500 text-sm font-medium uppercase tracking-wider">Google Merchant</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-blue-400">{reportData.indexing.google_merchant_synced}</span>
                    </div>
                    <span className="text-xs text-silver-400 mt-2">{reportData.indexing.google_merchant_pending} pending, {reportData.indexing.google_merchant_failed} failed</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-sm">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Activity size={18} /> Coverage Stats</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-silver-400">Schema Markup Coverage</span>
                          <span className="font-bold text-white">{reportData.seo_health.schema_coverage}%</span>
                        </div>
                        <div className="w-full bg-dark-700 rounded-full h-2">
                          <div className="bg-accent-500 h-2 rounded-full" style={{ width: `${reportData.seo_health.schema_coverage}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-silver-400">Product Image Coverage</span>
                          <span className="font-bold text-white">{reportData.seo_health.image_coverage}%</span>
                        </div>
                        <div className="w-full bg-dark-700 rounded-full h-2">
                          <div className="bg-accent-500 h-2 rounded-full" style={{ width: `${reportData.seo_health.image_coverage}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col gap-2 text-sm text-silver-400">
                      <div className="flex items-center gap-2">
                        {reportData.seo_health.has_robots_txt ? <CheckCircle size={16} className="text-accent-500" /> : <AlertTriangle size={16} className="text-red-500" />}
                        Robots.txt config valid
                      </div>
                      <div className="flex items-center gap-2">
                        {reportData.seo_health.has_sitemap ? <CheckCircle size={16} className="text-accent-500" /> : <AlertTriangle size={16} className="text-red-500" />}
                        Sitemaps generated
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* RECOMMENDATIONS TAB */}
            {activeSubTab === 'recommendations' && (
              <div className="bg-dark-800 rounded-2xl border border-dark-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-dark-700">
                  <h3 className="text-lg font-bold text-white">Actionable Insights</h3>
                </div>
                <div className="divide-y divide-dark-700">
                  {reportData.recommendations.length > 0 ? reportData.recommendations.map((rec: any, i: number) => (
                    <div key={i} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-dark-700/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                            rec.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                            rec.priority === 'High' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {rec.priority}
                          </span>
                          <span className="text-xs text-silver-500 uppercase tracking-wider">{rec.category}</span>
                        </div>
                        <h4 className="text-white font-medium">{rec.title}</h4>
                        <p className="text-sm text-silver-400 mt-1">Impact: {rec.impact}</p>
                      </div>
                      <div className="shrink-0 text-sm">
                        <span className="text-silver-500">Effort: </span>
                        <span className="font-bold text-white">{rec.effort}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-silver-500">No pressing recommendations right now. Good job!</div>
                  )}
                </div>
              </div>
            )}

            {/* CONTENT AUDIT TAB */}
            {activeSubTab === 'content' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 text-center">
                    <div className="text-2xl font-bold text-white">{reportData.content_audit.summary.missing_meta_titles}</div>
                    <div className="text-xs text-silver-500 mt-1">Missing Titles</div>
                  </div>
                  <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 text-center">
                    <div className="text-2xl font-bold text-amber-500">{reportData.content_audit.summary.missing_meta_descriptions}</div>
                    <div className="text-xs text-silver-500 mt-1">Missing Desc</div>
                  </div>
                  <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 text-center">
                    <div className="text-2xl font-bold text-white">{reportData.content_audit.summary.thin_content}</div>
                    <div className="text-xs text-silver-500 mt-1">Thin Content</div>
                  </div>
                  <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 text-center">
                    <div className="text-2xl font-bold text-white">{reportData.content_audit.summary.missing_images}</div>
                    <div className="text-xs text-silver-500 mt-1">Missing Images</div>
                  </div>
                  <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 text-center">
                    <div className="text-2xl font-bold text-red-400">{reportData.content_audit.summary.duplicates}</div>
                    <div className="text-xs text-silver-500 mt-1">Duplicates</div>
                  </div>
                </div>

                <div className="bg-dark-800 rounded-2xl border border-dark-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-dark-700">
                    <h3 className="text-lg font-bold text-white">Content Issues List</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-silver-400">
                      <thead className="text-xs text-silver-500 uppercase bg-dark-900/50 border-b border-dark-700">
                        <tr>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">URL</th>
                          <th className="px-6 py-4">Issues</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-700">
                        {reportData.content_audit.issues.map((issue: any, idx: number) => (
                          <tr key={idx} className="hover:bg-dark-700/30">
                            <td className="px-6 py-4 capitalize">{issue.type}</td>
                            <td className="px-6 py-4 font-medium text-white">{issue.name}</td>
                            <td className="px-6 py-4">{issue.url}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {issue.issues.map((iss: str, i: number) => (
                                  <span key={i} className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded border border-red-500/20">{iss}</span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {reportData.content_audit.issues.length === 0 && (
                          <tr><td colSpan={4} className="px-6 py-8 text-center">No issues found!</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCT PERFORMANCE TAB */}
            {activeSubTab === 'products' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* High Views, No Sales */}
                  <div className="bg-dark-800 rounded-2xl border border-dark-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-dark-700">
                      <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2"><AlertTriangle size={18} /> High Traffic, Zero Sales</h3>
                    </div>
                    <div className="divide-y divide-dark-700 max-h-96 overflow-y-auto custom-scrollbar">
                      {reportData.product_performance.high_views_no_sales.map((p: any) => (
                        <div key={p.id} className="p-4 flex justify-between items-center hover:bg-dark-700/50">
                          <div>
                            <div className="text-white font-medium text-sm">{p.name}</div>
                            <div className="text-xs text-silver-500">{p.category__name} • ₹{p.our_price}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-accent-500">{p.views} views</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Sellers */}
                  <div className="bg-dark-800 rounded-2xl border border-dark-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-dark-700">
                      <h3 className="text-lg font-bold text-accent-400 flex items-center gap-2"><TrendingUp size={18} /> Top Sellers</h3>
                    </div>
                    <div className="divide-y divide-dark-700 max-h-96 overflow-y-auto custom-scrollbar">
                      {reportData.product_performance.top_sellers.map((p: any) => (
                        <div key={p.id} className="p-4 flex justify-between items-center hover:bg-dark-700/50">
                          <div>
                            <div className="text-white font-medium text-sm">{p.name}</div>
                            <div className="text-xs text-silver-500">{p.category__name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-accent-500">{p.sold_count} sold</div>
                            <div className="text-xs text-silver-500">{p.views} views</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-dark-800 rounded-2xl border border-dark-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-dark-700">
                    <h3 className="text-lg font-bold text-white">Category Performance</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-silver-400">
                      <thead className="text-xs text-silver-500 uppercase bg-dark-900/50 border-b border-dark-700">
                        <tr>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Products</th>
                          <th className="px-6 py-4">Total Views</th>
                          <th className="px-6 py-4">Total Sold</th>
                          <th className="px-6 py-4">Conv. Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-700">
                        {reportData.product_performance.category_performance.map((c: any, idx: number) => (
                          <tr key={idx} className="hover:bg-dark-700/30">
                            <td className="px-6 py-4 font-medium text-white">{c.category__name}</td>
                            <td className="px-6 py-4">{c.product_count}</td>
                            <td className="px-6 py-4">{c.total_views}</td>
                            <td className="px-6 py-4 text-accent-400 font-bold">{c.total_sold}</td>
                            <td className="px-6 py-4">{c.conversion_rate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* BUSINESS ANALYTICS TAB */}
            {activeSubTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-silver-400">
                      <DollarSign size={20} className="text-accent-500" /> Total Revenue
                    </div>
                    <div className="text-3xl font-bold text-white">₹{reportData.order_analytics.total_revenue.toLocaleString()}</div>
                  </div>
                  <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-silver-400">
                      <BarChart2 size={20} className="text-blue-400" /> AOV
                    </div>
                    <div className="text-3xl font-bold text-white">₹{Math.round(reportData.order_analytics.avg_order_value).toLocaleString()}</div>
                  </div>
                  <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-silver-400">
                      <Users size={20} className="text-purple-400" /> Customers
                    </div>
                    <div className="text-3xl font-bold text-white">{reportData.customer_analytics.total_customers}</div>
                    <div className="text-xs text-silver-500 mt-1">{reportData.customer_analytics.repeat_customers} repeat</div>
                  </div>
                  <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-silver-400">
                      <AlertTriangle size={20} className="text-amber-500" /> RTO Rate
                    </div>
                    <div className="text-3xl font-bold text-white">{reportData.order_analytics.rto_rate}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-dark-800 rounded-2xl border border-dark-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-dark-700">
                      <h3 className="text-lg font-bold text-white">Top Cities by Revenue</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {reportData.order_analytics.top_cities.map((city: any, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-6 text-center text-silver-500 text-sm">{i+1}</div>
                              <div className="text-white text-sm font-medium">{city.delivery_city}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-accent-400">₹{city.revenue.toLocaleString()}</div>
                              <div className="text-xs text-silver-500">{city.count} orders</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-dark-800 rounded-2xl border border-dark-700 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-dark-700">
                      <h3 className="text-lg font-bold text-white">Blog Impact</h3>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-center gap-8">
                      <div className="text-center">
                        <div className="text-sm text-silver-400 mb-1">Total Blog Views</div>
                        <div className="text-4xl font-bold text-white">{reportData.blog_performance.total_blog_views.toLocaleString()}</div>
                      </div>
                      <div className="flex divide-x divide-dark-700">
                        <div className="flex-1 text-center">
                          <div className="text-2xl font-bold text-blue-400">{reportData.blog_performance.ai_generated_count}</div>
                          <div className="text-xs text-silver-500 mt-1">AI Articles</div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="text-2xl font-bold text-purple-400">{reportData.blog_performance.manual_count}</div>
                          <div className="text-xs text-silver-500 mt-1">Manual Articles</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
