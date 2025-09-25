import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get product counts by category
    const { data: products, error } = await supabase
      .from('products')
      .select('category')
      .eq('status', 'active')
      .eq('in_stock', true)

    if (error) {
      console.error('Category counts fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch category counts' },
        { status: 500 }
      )
    }

    // Count products per category
    const categoryCounts = products?.reduce((acc: any, product: any) => {
      const category = product.category
      if (acc[category]) {
        acc[category]++
      } else {
        acc[category] = 1
      }
      return acc
    }, {}) || {}

    return NextResponse.json({
      success: true,
      counts: categoryCounts
    })

  } catch (error) {
    console.error('Category counts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
