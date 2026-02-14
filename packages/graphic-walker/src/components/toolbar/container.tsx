import React from 'react';
import { IToolbarProps } from './toolbar-item';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Cog6ToothIcon } from '@heroicons/react/24/solid';
import { TooltipProvider, TooltipContent, TooltipTrigger, Tooltip } from '../ui/tooltip';
import { Button } from '../ui/button';

export function ToolbarItemContainer(props: { children: React.ReactNode | Iterable<React.ReactNode>; splitOnly?: boolean } & IToolbarProps) {
    const { openedKey, setOpenedKey, children, item } = props;
    const { key, disabled, form, label, styles } = item;
    const id = `${key}::form`;
    const opened = form && id === openedKey && !disabled;
    const splitOnly = form && props.splitOnly;

    return (
        <Popover open={!!opened} onOpenChange={(open) => (open ? setOpenedKey(id) : setOpenedKey(null))}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <div
                                className="m-0.5 rounded-md flex transition-colors hover:bg-muted hover:text-muted-foreground"
                                style={styles?.item}
                                data-testid={form ? `toolbar-${key}-trigger` : undefined}
                            >
                                <div onClick={splitOnly ? undefined : (e) => e.stopPropagation()}>{children}</div>
                                {form && (
                                    <Button
                                        variant="none"
                                        size="none"
                                        className="cursor-pointer group flex items-center h-8 mr-1"
                                        data-testid={`toolbar-${key}-form-toggle`}
                                        aria-label={`Open ${label} settings`}
                                    >
                                        <Cog6ToothIcon style={styles?.splitIcon} className="group-hover:translate-y-[40%] transition-transform w-2.5 h-2.5" />
                                    </Button>
                                )}
                            </div>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    {form && (
                        <PopoverContent className="p-0 w-fit" data-testid={`toolbar-${key}-form`}>
                            {form}
                        </PopoverContent>
                    )}
                    <TooltipContent hideWhenDetached>{label}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </Popover>
    );
}
