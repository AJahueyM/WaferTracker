import { createContext, useContext, type ReactNode } from 'react';
import type { IWaferDataSource } from '../data/IWaferDataSource';
import { CacheDataSource } from '../data/CacheDataSource';

const defaultDataSource: IWaferDataSource = new CacheDataSource({ persist: true });

const DataSourceContext = createContext<IWaferDataSource>(defaultDataSource);

export function DataSourceProvider({
  dataSource = defaultDataSource,
  children,
}: {
  dataSource?: IWaferDataSource;
  children: ReactNode;
}) {
  return <DataSourceContext.Provider value={dataSource}>{children}</DataSourceContext.Provider>;
}

/**
 * Hook to access the current data source anywhere in the component tree.
 */
export function useDataSource(): IWaferDataSource {
  return useContext(DataSourceContext);
}
