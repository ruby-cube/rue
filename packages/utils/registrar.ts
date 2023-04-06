export function useRegistrar<T>(): [T[], <I extends T>(item: I) => I] {
    const registry: any[] = [];
    function registrar(item: any) {
        registry.push(item);
        return item;
    }
    return [registry, registrar];
}