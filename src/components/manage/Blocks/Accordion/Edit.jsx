import {
  BlocksForm,
  Icon,
  SidebarPortal,
  BlocksToolbar,
} from '@plone/volto/components';
import {
  emptyBlocksForm,
  getBlocksLayoutFieldname,
} from '@plone/volto/helpers';
import helpSVG from '@plone/volto/icons/help.svg';
import { isEmpty, without } from 'lodash';
import React, { useState } from 'react';
import { Button, Segment } from 'semantic-ui-react';
import { withBlockExtensions } from '@plone/volto/helpers';
import { BlockDataForm } from '@plone/volto/components';
import { useIntl } from 'react-intl';
import AccordionEdit from './AccordionEdit';
import EditBlockWrapper from './EditBlockWrapper';
import './editor.less';
import { AccordionBlockSchema } from './Schema';
import { emptyAccordion, getPanels } from './util';
import { cloneDeep } from 'lodash';
import config from '@plone/volto/registry';

const Edit = (props) => {
  const [selectedBlock, setSelectedBlock] = useState({});
  const [multiSelected, setMultiSelected] = useState([]);
  const {
    block,
    data,
    onChangeBlock,
    onChangeField,
    pathname,
    selected,
    manage,
    formDescription,
  } = props;
  const intl = useIntl();
  const properties = isEmpty(data?.data?.blocks)
    ? emptyAccordion(3)
    : data.data;
  const metadata = props.metadata || props.properties;
  const [currentUid, setCurrentUid] = useState('');

  const onSelectBlock = (uid, id, isMultipleSelection, event, activeBlock) => {
    let newMultiSelected = [];
    let selected = id;

    if (Object.values(activeBlock || {})?.length > 0) {
      activeBlock = Object.values(activeBlock)[0];
    }
    if (data?.data?.blocks?.hasOwnProperty(uid) && isMultipleSelection) {
      selected = null;
      const blocksLayoutFieldname = getBlocksLayoutFieldname(
        data.data.blocks[uid],
      );

      const blocks_layout = data.data.blocks[uid][blocksLayoutFieldname].items;

      if (event.shiftKey) {
        const anchor =
          multiSelected.length > 0
            ? blocks_layout.indexOf(multiSelected[0])
            : blocks_layout.indexOf(activeBlock);
        const focus = blocks_layout.indexOf(id);
        if (anchor === focus) {
          newMultiSelected = [id];
        } else if (focus > anchor) {
          newMultiSelected = [...blocks_layout.slice(anchor, focus + 1)];
        } else {
          newMultiSelected = [...blocks_layout.slice(focus, anchor + 1)];
        }
      }
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
        if (multiSelected.includes(id)) {
          selected = null;
          newMultiSelected = without(multiSelected, id);
        } else {
          newMultiSelected = [...(multiSelected || []), id];
        }
      }
    }

    setSelectedBlock({ [uid]: selected });
    setCurrentUid(uid);
    setMultiSelected(newMultiSelected);
  };

  const searchElementInMultiSelection = (uid, blockprops) => {
    if (
      multiSelected.find((el) => {
        if (el === blockprops.block) return true;
        return false;
      })
    )
      return true;
    return false;
  };
  const applySchemaEnhancer = (originalSchema) => {
    let schema, schemaEnhancer;
    const formData = data;
    const { blocks } = config;

    const blockType = formData['@type'];
    const variations = blocks?.blocksConfig[blockType]?.variations || [];

    if (variations.length === 0) {
      // No variations present but anyways
      // finalize the schema with a schemaEnhancer in the block config is present
      schemaEnhancer = blocks.blocksConfig?.[blockType]?.schemaEnhancer;
      if (schemaEnhancer)
        schema = schemaEnhancer({ schema: originalSchema, formData, intl });
    }

    const activeItemName = formData?.variation;
    let activeItem = variations.find((item) => item.id === activeItemName);
    if (!activeItem) activeItem = variations.find((item) => item.isDefault);

    schemaEnhancer = activeItem?.['schemaEnhancer'];

    schema = schemaEnhancer
      ? schemaEnhancer({ schema: cloneDeep(originalSchema), formData, intl })
      : cloneDeep(originalSchema);

    return schema;
  };

  /**
   * Will set field values from schema, by matching the default values
   * @returns {Object} defaultValues
   */
  const setInitialData = () => {
    const accordionSchema = applySchemaEnhancer(AccordionBlockSchema({ intl }));
    const defaultValues = Object.keys(accordionSchema.properties).reduce(
      (accumulator, currentVal) => {
        return accordionSchema.properties[currentVal].default
          ? {
              ...accumulator,
              [currentVal]: accordionSchema.properties[currentVal].default,
            }
          : accumulator;
      },
      {},
    );

    return {
      ...defaultValues,
      ...data,
      data: {
        ...properties,
      },
    };
  };

  React.useEffect(() => {
    if (isEmpty(data?.data)) {
      onChangeBlock(block, setInitialData());
    }
    /* eslint-disable-next-line */
  }, []);

  React.useEffect(() => {
    properties.blocks_layout.items.map((item) => {
      if (isEmpty(properties.blocks[item]?.blocks)) {
        return onChangeBlock(block, {
          ...data,
          data: {
            ...properties,
            blocks: {
              ...properties.blocks,
              [item]: emptyBlocksForm(),
            },
          },
        });
      }
      return undefined;
    });
  }, [
    onChangeBlock,
    properties,
    selectedBlock,
    block,
    data,
    properties.blocks,
  ]);

  const blockState = {};
  const panelData = properties;
  const panels = getPanels(panelData);

  const handleTitleChange = (e, value) => {
    const [uid, panel] = value;
    const modifiedBlock = {
      ...panel,
      title: e.target.value,
      '@type': 'accordionPanel',
    };
    onChangeBlock(block, {
      ...data,
      data: {
        ...panelData,
        blocks: {
          ...panelData.blocks,
          [uid]: modifiedBlock,
        },
      },
    });
  };

  // Get editing instructions from block settings or props
  let instructions = data?.instructions?.data || data?.instructions;
  if (!instructions || instructions === '<p><br/></p>') {
    instructions = formDescription;
  }

  const changeBlockData = (newBlockData) => {
    const selectedIndex =
      data.data.blocks[currentUid].blocks_layout.items.indexOf(
        Object.values(selectedBlock)[0],
      ) + 1;
    let pastedBlocks = Object.entries(newBlockData.blocks).filter((block) => {
      let key = block[0];

      if (
        data?.data?.blocks[currentUid].blocks_layout.items.find(
          (x) => x === key,
        )
      )
        return false;
      return true;
    });

    let blockLayout = pastedBlocks.map((el) => el[0]);

    onChangeBlock(block, {
      ...data,
      data: {
        blocks: {
          ...data.data.blocks,
          [currentUid]: {
            ...data.data.blocks[currentUid],
            ...newBlockData,
            blocks_layout: {
              items: [
                ...data.data.blocks[currentUid].blocks_layout.items.slice(
                  0,
                  selectedIndex,
                ),
                ...blockLayout,
                ...data.data.blocks[currentUid].blocks_layout.items.slice(
                  selectedIndex,
                ),
              ],
            },
          },
        },
        blocks_layout: data.data.blocks_layout,
      },
    });
  };

  return (
    <fieldset className="accordion-block">
      <legend
        onClick={() => {
          setSelectedBlock({});
          props.setSidebarTab(1);
        }}
        aria-hidden="true"
      >
        {data.title || 'Accordion'}
      </legend>
      {panels.map(([uid, panel], index) => (
        <AccordionEdit
          uid={uid}
          panel={panel}
          panelData={panelData}
          handleTitleChange={handleTitleChange}
          handleTitleClick={() => setSelectedBlock({})}
          data={data}
          index={index}
        >
          <BlocksForm
            key={uid}
            title={data.placeholder}
            description={instructions}
            manage={manage}
            allowedBlocks={data.allowedBlocks}
            metadata={metadata}
            properties={isEmpty(panel) ? emptyBlocksForm() : panel}
            selectedBlock={selected ? selectedBlock[uid] : null}
            onSelectBlock={(id, l, e) => {
              const isMultipleSelection = e
                ? e.shiftKey || e.ctrlKey || e.metaKey
                : false;
              onSelectBlock(uid, id, isMultipleSelection, e, selectedBlock);
            }}
            onChangeFormData={(newFormData) => {
              onChangeBlock(block, {
                ...data,
                data: {
                  ...panelData,
                  blocks: {
                    ...panelData.blocks,
                    [uid]: newFormData,
                  },
                },
              });
            }}
            onChangeField={(id, value) => {
              if (['blocks', 'blocks_layout'].indexOf(id) > -1) {
                blockState[id] = value;
                onChangeBlock(block, {
                  ...data,
                  data: {
                    ...panelData,
                    blocks: {
                      ...panelData.blocks,
                      [uid]: {
                        ...panelData.blocks?.[uid],
                        ...blockState,
                      },
                    },
                  },
                });
              } else {
                onChangeField(id, value);
              }
            }}
            pathname={pathname}
          >
            {({ draginfo }, editBlock, blockProps) => {
              return (
                <EditBlockWrapper
                  draginfo={draginfo}
                  blockProps={blockProps}
                  disabled={data.disableInnerButtons}
                  multiSelected={searchElementInMultiSelection(uid, blockProps)}
                  extraControls={
                    <>
                      {instructions && (
                        <>
                          <Button
                            icon
                            basic
                            title="Section help"
                            onClick={() => {
                              setSelectedBlock({});
                              const tab = manage ? 0 : 1;
                              props.setSidebarTab(tab);
                            }}
                          >
                            <Icon name={helpSVG} className="" size="19px" />
                          </Button>
                        </>
                      )}
                    </>
                  }
                >
                  {editBlock}
                </EditBlockWrapper>
              );
            }}
          </BlocksForm>
        </AccordionEdit>
      ))}
      {selected ? (
        <BlocksToolbar
          selectedBlock={Object.keys(selectedBlock)[0]}
          formData={data?.data?.blocks[currentUid]}
          selectedBlocks={multiSelected}
          onSetSelectedBlocks={(blockIds) => {
            setMultiSelected(blockIds);
          }}
          onSelectBlock={(id, l, e) => {
            const isMultipleSelection = e
              ? e.shiftKey || e.ctrlKey || e.metaKey
              : false;

            onSelectBlock(id, isMultipleSelection, e, selectedBlock);
          }}
          onChangeBlocks={(newBlockData) => {
            changeBlockData(newBlockData);
          }}
        />
      ) : (
        ''
      )}

      <SidebarPortal selected={selected && !Object.keys(selectedBlock).length}>
        {instructions && (
          <Segment attached>
            <div dangerouslySetInnerHTML={{ __html: instructions }} />
          </Segment>
        )}
        {!data?.readOnlySettings && (
          <BlockDataForm
            schema={AccordionBlockSchema({ intl })}
            title="Accordion block"
            onChangeField={(id, value) => {
              onChangeBlock(block, {
                ...data,
                [id]: value,
              });
            }}
            formData={data}
            block={block}
          />
        )}
      </SidebarPortal>
    </fieldset>
  );
};

export default withBlockExtensions(Edit);
