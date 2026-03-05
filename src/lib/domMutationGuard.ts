/**
 * Guards against NotFoundError DOM exceptions caused by external DOM mutations
 * (browser translation/extensions) that desynchronize React's expected tree.
 */
export function installDomMutationGuard(): void {
  if (typeof window === 'undefined' || typeof Node === 'undefined') return

  const markerKey = '__kya_dom_mutation_guard_installed__'
  const globalWindow = window as Window & { [key: string]: unknown }
  if (globalWindow[markerKey]) return
  globalWindow[markerKey] = true

  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (!child) return child
    if (child.parentNode !== this) {
      return child
    }

    try {
      return originalRemoveChild.call(this, child) as T
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        return child
      }
      throw error
    }
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return this.appendChild(newNode) as T
    }

    try {
      return originalInsertBefore.call(this, newNode, referenceNode) as T
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        return this.appendChild(newNode) as T
      }
      throw error
    }
  }

  const originalReplaceChild = Node.prototype.replaceChild
  Node.prototype.replaceChild = function <T extends Node>(newChild: T, oldChild: Node): Node {
    if (oldChild && oldChild.parentNode !== this) {
      return this.appendChild(newChild)
    }

    try {
      return originalReplaceChild.call(this, newChild, oldChild)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        return this.appendChild(newChild)
      }
      throw error
    }
  }
}
