export interface CategoryCount {
  name: string;
  count: number;
}

/** Métricas de inventario para el panel de analítica. */
export interface AnalyticsSummary {
  totalBooks: number;
  availableBooks: number;
  outOfStockBooks: number;
  totalStock: number;
  inventoryValue: number; // Σ (precio × stock) de los libros vigentes
  totalAuthors: number;
  totalPublishers: number;
  totalGenres: number;
  booksByGenre: CategoryCount[];
  booksByPublisher: CategoryCount[];
  topAuthors: CategoryCount[];
}
