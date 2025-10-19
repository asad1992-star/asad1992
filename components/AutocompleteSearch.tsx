import React, { useState, useRef, useEffect } from 'react';

interface AutocompleteSearchProps<T> {
  placeholder: string;
  items: T[];
  filterFn: (item: T, query: string) => boolean;
  displayFn: (item: T) => string;
  onSelect: (item: T | null) => void;
}

export function AutocompleteSearch<T extends { id: string }>({ placeholder, items, filterFn, displayFn, onSelect }: AutocompleteSearchProps<T>) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<T | null>(null);
  const [results, setResults] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
      setActiveIndex(-1);
  }, [results])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelected(null);
    onSelect(null);
    if (newQuery.length > 0) {
      const filteredResults = items.filter(item => filterFn(item, newQuery)).slice(0, 10)
      setResults(filteredResults);
      setIsOpen(filteredResults.length > 0);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (item: T) => {
    setQuery(displayFn(item));
    setSelected(item);
    onSelect(item);
    setIsOpen(false);
  };

  const handleClear = () => {
      setSelected(null);
      setQuery('');
      onSelect(null);
      inputRef.current?.focus();
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch(e.key) {
          case 'ArrowDown':
              e.preventDefault();
              setActiveIndex(prev => (prev + 1) % results.length);
              break;
          case 'ArrowUp':
              e.preventDefault();
              setActiveIndex(prev => (prev - 1 + results.length) % results.length);
              break;
          case 'Enter':
              if (activeIndex >= 0 && results[activeIndex]) {
                  e.preventDefault();
                  handleSelect(results[activeIndex]);
              }
              break;
          case 'Escape':
              setIsOpen(false);
              break;
      }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if(!selected && query.length > 0 && results.length > 0) setIsOpen(true); }}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-100 disabled:text-gray-900"
        disabled={!!selected}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls="autocomplete-results"
        aria-activedescendant={activeIndex >= 0 ? `autocomplete-item-${activeIndex}` : undefined}
      />
      {selected && (
        <button type="button" onClick={handleClear} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-800">
           &times;
        </button>
      )}
      {isOpen && results.length > 0 && (
        <ul 
            id="autocomplete-results"
            role="listbox"
            className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto shadow-lg"
        >
          {results.map((item, index) => (
            <li
              id={`autocomplete-item-${index}`}
              key={item.id}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`px-3 py-2 cursor-pointer ${index === activeIndex ? 'bg-blue-500 text-white' : 'text-gray-900 hover:bg-gray-100'}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              {displayFn(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}