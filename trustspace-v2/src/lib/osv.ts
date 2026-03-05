interface OSVVulnerability {
  id: string;
  summary?: string;
  details?: string;
  severity?: Array<{
    type: "CVSS_V2" | "CVSS_V3";
    score: string;
  }>;
  database_specific?: {
    severity?: string;
  };
  ecosystem_specific?: any;
}

interface OSVQuery {
  package: {
    name: string;
    ecosystem: string;
    purl?: string;
  };
}

interface OSVBatchResponse {
  results: Array<{
    vulns: OSVVulnerability[];
  }>;
}

export interface VulnerabilityResult {
  cveId: string;
  cvssScore?: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary?: string;
  details?: string;
}

export class OSVClient {
  private static readonly BASE_URL = "https://api.osv.dev/v1";
  private static readonly BATCH_SIZE = 100;
  private static readonly REQUEST_DELAY = 100; // ms between requests for rate limiting

  /**
   * Batch scan multiple PURLs for vulnerabilities
   */
  static async batchScanPurls(purls: string[]): Promise<Map<string, VulnerabilityResult[]>> {
    const results = new Map<string, VulnerabilityResult[]>();
    const queries: OSVQuery[] = [];

    // Convert PURLs to OSV queries
    for (const purl of purls) {
      const query = this.purlToOSVQuery(purl);
      if (query) {
        queries.push(query);
      }
    }

    // Process in batches
    for (let i = 0; i < queries.length; i += this.BATCH_SIZE) {
      const batch = queries.slice(i, i + this.BATCH_SIZE);

      try {
        const batchResults = await this.executeBatchQuery(batch);

        // Map results back to PURLs
        batch.forEach((query, index) => {
          const purl = this.queryToPurl(query);
          const vulnerabilities = batchResults.results[index]?.vulns || [];
          const processedVulns = vulnerabilities.map(vuln => this.processVulnerability(vuln));
          results.set(purl, processedVulns);
        });

        // Rate limiting delay
        if (i + this.BATCH_SIZE < queries.length) {
          await this.delay(this.REQUEST_DELAY);
        }
      } catch (error) {
        console.error(`Failed to process batch ${i / this.BATCH_SIZE + 1}:`, error);

        // On error, try individual queries as fallback
        for (const query of batch) {
          try {
            const individualResult = await this.querySingle(query.package);
            const purl = this.queryToPurl(query);
            const processedVulns = individualResult.map(vuln => this.processVulnerability(vuln));
            results.set(purl, processedVulns);

            await this.delay(this.REQUEST_DELAY);
          } catch (individualError) {
            console.error(`Failed individual query for ${query.package.name}:`, individualError);
            results.set(this.queryToPurl(query), []);
          }
        }
      }
    }

    return results;
  }

  /**
   * Execute batch query to OSV API
   */
  private static async executeBatchQuery(queries: OSVQuery[]): Promise<OSVBatchResponse> {
    const response = await fetch(`${this.BASE_URL}/querybatch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queries: queries.map(q => ({
          package: q.package.purl
            ? { purl: q.package.purl }
            : { name: q.package.name, ecosystem: q.package.ecosystem },
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`OSV API error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Query single package for vulnerabilities
   */
  private static async querySingle(packageInfo: OSVQuery["package"]): Promise<OSVVulnerability[]> {
    const response = await fetch(`${this.BASE_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        package: packageInfo.purl
          ? { purl: packageInfo.purl }
          : { name: packageInfo.name, ecosystem: packageInfo.ecosystem },
      }),
    });

    if (!response.ok) {
      throw new Error(`OSV API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data.vulns || [];
  }

  /**
   * Convert PURL to OSV query format
   */
  private static purlToOSVQuery(purl: string): OSVQuery | null {
    try {
      // Parse PURL: pkg:type/namespace/name@version
      const purlMatch = purl.match(/^pkg:([^/]+)\/?((?:[^/]+\/)*)?([^@]+)(?:@([^?]+))?/);
      if (!purlMatch) {
        console.warn(`Invalid PURL format: ${purl}`);
        return null;
      }

      const [, type, namespace, name, version] = purlMatch;

      // Map PURL types to OSV ecosystems
      const ecosystem = this.purlTypeToEcosystem(type);
      if (!ecosystem) {
        console.warn(`Unsupported PURL type: ${type}`);
        return null;
      }

      let packageName = name;
      if (namespace) {
        // Remove trailing slash and combine with name
        const cleanNamespace = namespace.replace(/\/$/, "");
        packageName = `${cleanNamespace}/${name}`;
      }

      return {
        package: {
          name: packageName,
          ecosystem,
          purl,
        },
      };
    } catch (error) {
      console.error(`Error parsing PURL ${purl}:`, error);
      return null;
    }
  }

  /**
   * Map PURL type to OSV ecosystem
   */
  private static purlTypeToEcosystem(purlType: string): string | null {
    const mapping: Record<string, string> = {
      "npm": "npm",
      "pypi": "PyPI",
      "maven": "Maven",
      "nuget": "NuGet",
      "gem": "RubyGems",
      "cargo": "crates.io",
      "golang": "Go",
      "hex": "Hex",
      "composer": "Packagist",
      "swift": "SwiftURL",
    };

    return mapping[purlType.toLowerCase()] || null;
  }

  /**
   * Convert OSV query back to PURL for mapping
   */
  private static queryToPurl(query: OSVQuery): string {
    return query.package.purl || `pkg:unknown/${query.package.name}`;
  }

  /**
   * Process OSV vulnerability to our format
   */
  private static processVulnerability(vuln: OSVVulnerability): VulnerabilityResult {
    let cvssScore: number | undefined;
    let severity: VulnerabilityResult["severity"] = "LOW";

    // Extract CVSS score
    if (vuln.severity) {
      for (const severityEntry of vuln.severity) {
        if (severityEntry.type === "CVSS_V3" || severityEntry.type === "CVSS_V2") {
          const score = parseFloat(severityEntry.score);
          if (!isNaN(score)) {
            cvssScore = score;
            break;
          }
        }
      }
    }

    // Fallback to database-specific severity
    if (!cvssScore && vuln.database_specific?.severity) {
      const dbSeverity = vuln.database_specific.severity.toUpperCase();
      if (["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(dbSeverity)) {
        severity = dbSeverity as VulnerabilityResult["severity"];
      }
    }

    // Map CVSS score to severity
    if (cvssScore !== undefined) {
      severity = this.cvssToSeverity(cvssScore);
    }

    return {
      cveId: vuln.id,
      cvssScore,
      severity,
      summary: vuln.summary,
      details: vuln.details,
    };
  }

  /**
   * Convert CVSS score to severity level
   */
  private static cvssToSeverity(score: number): VulnerabilityResult["severity"] {
    if (score >= 9.0) return "CRITICAL";
    if (score >= 7.0) return "HIGH";
    if (score >= 4.0) return "MEDIUM";
    return "LOW";
  }

  /**
   * Delay helper for rate limiting
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate and clean PURL
   */
  static validatePurl(purl: string): boolean {
    try {
      const purlRegex = /^pkg:[A-Za-z\.\-\+][A-Za-z0-9\.\-\+]*\/[\s\S]*$/;
      return purlRegex.test(purl);
    } catch {
      return false;
    }
  }

  /**
   * Get vulnerability summary for a set of vulnerabilities
   */
  static getVulnerabilitySummary(vulnerabilities: VulnerabilityResult[]): {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  } {
    const summary = {
      total: vulnerabilities.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case "CRITICAL":
          summary.critical++;
          break;
        case "HIGH":
          summary.high++;
          break;
        case "MEDIUM":
          summary.medium++;
          break;
        case "LOW":
          summary.low++;
          break;
      }
    });

    return summary;
  }
}