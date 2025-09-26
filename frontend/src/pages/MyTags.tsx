import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Plus, X, Search, Tag } from 'lucide-react'

interface Tag {
  id: string
  name: string
  category: 'sport' | 'skill' | 'interest' | 'professional'
  color: string
}

const mockTags: Tag[] = [
  { id: '1', name: 'Basketball', category: 'sport', color: 'bg-orange-500' },
  { id: '2', name: 'Tennis', category: 'sport', color: 'bg-green-500' },
  { id: '3', name: 'React', category: 'skill', color: 'bg-blue-500' },
  {
    id: '4',
    name: 'Leadership',
    category: 'professional',
    color: 'bg-purple-500',
  },
  { id: '5', name: 'Photography', category: 'interest', color: 'bg-pink-500' },
  { id: '6', name: 'Running', category: 'sport', color: 'bg-red-500' },
]

const categoryLabels = {
  sport: 'Sports',
  skill: 'Skills',
  interest: 'Interests',
  professional: 'Professional',
}

export default function MyTags() {
  const [tags, setTags] = useState<Tag[]>(mockTags)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [newTagName, setNewTagName] = useState('')
  const [newTagCategory, setNewTagCategory] = useState<Tag['category']>('sport')

  const filteredTags = tags.filter((tag) => {
    const matchesSearch = tag.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || tag.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addTag = () => {
    if (newTagName.trim()) {
      const newTag: Tag = {
        id: Date.now().toString(),
        name: newTagName.trim(),
        category: newTagCategory,
        color: getRandomColor(),
      }
      setTags([...tags, newTag])
      setNewTagName('')
    }
  }

  const removeTag = (id: string) => {
    setTags(tags.filter((tag) => tag.id !== id))
  }

  const getRandomColor = () => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-orange-500',
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Tag className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold md:text-4xl">My Tags</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your personal tags and interests
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Search tags
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search your tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All
              </Button>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Add New Tag */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Tag</CardTitle>
            <CardDescription>
              Create a new tag to add to your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <Label htmlFor="tagName">Tag Name</Label>
                <Input
                  id="tagName"
                  placeholder="Enter tag name..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
              </div>
              <div className="sm:w-48">
                <Label htmlFor="tagCategory">Category</Label>
                <select
                  id="tagCategory"
                  value={newTagCategory}
                  onChange={(e) =>
                    setNewTagCategory(e.target.value as Tag['category'])
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={addTag} disabled={!newTagName.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tag
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Your Tags ({filteredTags.length})
            </h2>
          </div>

          {filteredTags.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No tags found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedCategory !== 'all'
                    ? 'Try adjusting your search or filter'
                    : 'Start by adding your first tag above'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTags.map((tag) => (
                <Card
                  key={tag.id}
                  className="group hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${tag.color}`} />
                        <div>
                          <div className="font-medium">{tag.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {categoryLabels[tag.category]}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTag(tag.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
