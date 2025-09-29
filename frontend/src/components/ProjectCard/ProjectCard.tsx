import React from 'react';
import { Card, Tag, Tooltip, Badge } from 'antd';
import { PlayCircleOutlined, StopOutlined, FolderOpenOutlined, DeleteOutlined, EditOutlined, CodeOutlined, EnvironmentOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../../services/api';
import './ProjectCard.css';

interface ProjectCardProps {
  project: Project;
  isRunning: boolean;
  cliTagName?: string;
  envTagName?: string;
  ideTagName?: string;
  groupColor?: string;
  onStart: (project: Project) => void;
  onStop: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onOpenFolder: (project: Project) => void;
  onOpenIDE?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isRunning,
  cliTagName,
  envTagName,
  ideTagName,
  groupColor,
  onStart,
  onStop,
  onEdit,
  onDelete,
  onOpenFolder,
  onOpenIDE,
}) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      layout
    >
      <Badge.Ribbon
        text={isRunning ? t('project.running') : null}
        color={isRunning ? 'green' : 'transparent'}
        style={{ display: isRunning ? 'block' : 'none' }}
      >
        <Card
          className={`project-card ${isRunning ? 'project-running' : ''}`}
          style={{
            borderTop: groupColor ? `3px solid ${groupColor}` : undefined
          }}
        title={
          <div className="project-card-title">
            <Tooltip title={project.name}>
              <span className="project-name">{project.name}</span>
            </Tooltip>
            {isRunning && (
              <Tag color="success" style={{ margin: 0, fontSize: '11px' }}>
                {t('project.running')}
              </Tag>
            )}
          </div>
        }
        actions={[
          isRunning ? (
            <Tooltip title={t('project.stop')}>
              <StopOutlined
                key="stop"
                onClick={(e) => {
                  e.stopPropagation();
                  onStop(project);
                }}
              />
            </Tooltip>
          ) : (
            <Tooltip title={t('project.start')}>
              <PlayCircleOutlined
                key="start"
                onClick={(e) => {
                  e.stopPropagation();
                  onStart(project);
                }}
              />
            </Tooltip>
          ),
          <Tooltip title={t('project.edit')}>
            <EditOutlined
              key="edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
            />
          </Tooltip>,
          <Tooltip title={t('project.openFolder')}>
            <FolderOpenOutlined
              key="folder"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFolder(project);
              }}
            />
          </Tooltip>,
          ...(onOpenIDE && project.default_ide_tag ? [
            <Tooltip key="ide" title={t('project.openIDE', { ide: ideTagName || 'IDE' })}>
              <AppstoreOutlined
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenIDE(project);
                }}
              />
            </Tooltip>
          ] : []),
          <Tooltip title={t('project.delete')}>
            <DeleteOutlined
              key="delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project);
              }}
              style={{ color: '#ff4d4f' }}
            />
          </Tooltip>,
        ]}
      >
        <div className="project-card-content">
          <Tooltip title={project.description || t('project.noDescription')}>
            <p className="project-description">
              {project.description || t('project.noDescription')}
            </p>
          </Tooltip>

          <div className="project-tags">
            {project.default_cli_tag && cliTagName ? (
              <Tooltip title={t('project.defaultCli')}>
                <Tag icon={<CodeOutlined />} color="blue" className="project-tag">
                  {cliTagName}
                </Tag>
              </Tooltip>
            ) : project.default_cli_tag ? (
              <Tooltip title={t('project.defaultCli')}>
                <Tag icon={<CodeOutlined />} color="blue" className="project-tag">
                  {t('project.loadingTag')}
                </Tag>
              </Tooltip>
            ) : (
              <Tag color="default" className="project-tag" style={{ fontSize: '11px' }}>
                {t('project.projectLaunchWith')}
              </Tag>
            )}
            {project.default_env_tag && envTagName ? (
              <Tooltip title={t('project.defaultEnv')}>
                <Tag icon={<EnvironmentOutlined />} color="green" className="project-tag">
                  {envTagName}
                </Tag>
              </Tooltip>
            ) : project.default_env_tag ? (
              <Tooltip title={t('project.defaultEnv')}>
                <Tag icon={<EnvironmentOutlined />} color="green" className="project-tag">
                  {t('project.loadingTag')}
                </Tag>
              </Tooltip>
            ) : null}
          </div>

          <Tooltip title={project.path || ''}>
            <div className="project-path">
              <FolderOpenOutlined style={{ marginRight: 6 }} />
              {project.path
                ? (project.path.length > 50
                  ? '...' + project.path.slice(-47)
                  : project.path)
                : t('project.path')
              }
            </div>
          </Tooltip>
        </div>
        </Card>
      </Badge.Ribbon>
    </motion.div>
  );
};

export default ProjectCard;
