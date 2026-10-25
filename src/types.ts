export type SourceFile = {
  path: string;
  content: string;
};

export type Domain = {
  name: string;
  files: string[];
};

export type DomainEdge = {
  from: string;
  to: string;
  weight: number;
};

export type DomainMap = {
  domains: Domain[];
  edges: DomainEdge[];
};

export type BlastRadius = {
  target: string;
  exists: boolean;
  affectedFiles: string[];
  affectedDomains: string[];
};

export type MapNarrative = {
  summary: string;
  notableConcerns: string[];
};
