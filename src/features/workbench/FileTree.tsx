import { useEffect, useState } from 'react';
import { Icon } from '../../components/icons/Icon';
import type { FileTreeNode } from '../../types/contracts';

interface ContextState { x: number; y: number; node: FileTreeNode }
interface FileTreeProps {
  nodes: FileTreeNode[];
  activePath?: string;
  onOpen(path: string): void;
  onCreate(parentPath: string, kind: 'file' | 'directory'): void;
  onImport(parentPath: string): void;
  onRename(node: FileTreeNode): void;
  onDelete(node: FileTreeNode): void;
}

function TreeNode({
  node, depth, activePath, onOpen, onContext,
}: {
  node: FileTreeNode;
  depth: number;
  activePath?: string;
  onOpen(path: string): void;
  onContext(event: React.MouseEvent, node: FileTreeNode): void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDirectory = node.type === 'directory';
  return (
    <div className="tree-node">
      <button
        className={`tree-node__row ${activePath === node.path ? 'is-active' : ''}`}
        style={{ paddingLeft: 10 + depth * 13 }}
        onClick={() => isDirectory ? setExpanded((value) => !value) : onOpen(node.path)}
        onContextMenu={(event) => onContext(event, node)}
        title={node.path}
      >
        <Icon name={isDirectory ? (expanded ? 'chevron-down' : 'chevron-right') : 'file'} size={isDirectory ? 12 : 14} />
        {isDirectory && <Icon name="folder" size={14} />}
        <span>{node.name}</span>
      </button>
      {isDirectory && expanded && node.children?.map((child) => (
        <TreeNode key={child.path} node={child} depth={depth + 1} activePath={activePath} onOpen={onOpen} onContext={onContext} />
      ))}
    </div>
  );
}

export function FileTree({ nodes, activePath, onOpen, onCreate, onImport, onRename, onDelete }: FileTreeProps) {
  const [context, setContext] = useState<ContextState | null>(null);
  useEffect(() => {
    const close = () => setContext(null);
    window.addEventListener('pointerdown', close);
    window.addEventListener('blur', close);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('blur', close);
    };
  }, []);
  if (!nodes.length) return <div className="panel-empty">This workspace is empty.</div>;
  return (
    <>
      <div className="file-tree">
        {nodes.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            activePath={activePath}
            onOpen={onOpen}
            onContext={(event, selected) => {
              event.preventDefault();
              event.stopPropagation();
              setContext({ x: event.clientX, y: event.clientY, node: selected });
            }}
          />
        ))}
      </div>
      {context && (
        <div className="context-menu" style={{ left: context.x, top: context.y }} onPointerDown={(event) => event.stopPropagation()}>
          {context.node.type === 'directory' && <>
            <button onClick={() => { onCreate(context.node.path, 'file'); setContext(null); }}><Icon name="file" size={14} /> New file</button>
            <button onClick={() => { onCreate(context.node.path, 'directory'); setContext(null); }}><Icon name="folder" size={14} /> New folder</button>
            <button onClick={() => { onImport(context.node.path); setContext(null); }}><Icon name="arrow-right" size={14} /> Import files</button>
            <span />
          </>}
          {context.node.type === 'file' && <button onClick={() => { onOpen(context.node.path); setContext(null); }}><Icon name="code" size={14} /> Open</button>}
          <button onClick={() => { onRename(context.node); setContext(null); }}><Icon name="command" size={14} /> Rename</button>
          <button className="is-danger" onClick={() => { onDelete(context.node); setContext(null); }}><Icon name="close" size={14} /> Move to Recycle Bin</button>
        </div>
      )}
    </>
  );
}
