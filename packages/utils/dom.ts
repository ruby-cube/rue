export const dom = {
    findForebear(tag: string, node: Node) {
        let current = node.parentElement;
        while (current && current.tagName !== tag.toUpperCase()) {
            current = current.parentElement;
        }
        return current;
    }
}